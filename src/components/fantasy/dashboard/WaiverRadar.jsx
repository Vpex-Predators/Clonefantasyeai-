import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink, Loader2, Newspaper, Radar } from "lucide-react";

const CATEGORY_STYLES = {
  fills_weak_spot: { label: "Fills a hole", cls: "border-amber-400/30 bg-amber-400/15 text-amber-300" },
  handcuff: { label: "Handcuff", cls: "border-sky-400/30 bg-sky-400/15 text-sky-300" },
  overlooked: { label: "Overlooked", cls: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300" },
  streamer: { label: "Streamer", cls: "border-violet-400/30 bg-violet-400/15 text-violet-300" }
};
const PRIORITY_LABELS = { high: "Top target", medium: "Solid add", low: "Keep an eye" };
const INJURY_LABELS = { QUESTIONABLE: "questionable", OUT: "out", INJURY_RESERVE: "on IR", SUSPENSION: "suspended" };
const lastName = n => String(n || "").split(" ").slice(-1)[0];
const positionLabel = pos => (pos === "DST" ? "D/ST" : pos);

export default function WaiverRadar({ freeAgents, bench, starters }) {
  const [targets, setTargets] = useState(null);
  const [weaknesses, setWeaknesses] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [openName, setOpenName] = useState(null);

  // Quick live flags from the lineup: injured starters without a backup.
  const lineFlags = useMemo(() => {
    const benchPos = new Set((bench || []).map(b => b.position));
    return (starters || [])
      .filter(s => INJURY_LABELS[s.injuryStatus] && !benchPos.has(s.position))
      .map(s => `${lastName(s.name)} is ${INJURY_LABELS[s.injuryStatus]} and you have no backup ${s.position}`);
  }, [starters, bench]);

  const scan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getWaiverTargets", {});
      setTargets(res.data.targets || []);
      setWeaknesses(res.data.weaknesses || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Scan failed — try again in a bit.");
    } finally {
      setScanning(false);
    }
  };

  const wireList = (freeAgents || []).slice(0, 5);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">Waiver radar</h2>
        <button
          onClick={scan}
          disabled={scanning}
          className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
          {scanning ? "Scanning" : "Scan the wire"}
        </button>
      </div>

      {lineFlags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {lineFlags.map(f => (
            <span key={f} className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[10px] font-medium text-rose-300">
              <AlertTriangle className="h-3 w-3" /> {f}
            </span>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}

      {scanning && (
        <p className="py-2 text-xs text-white/50">Checking live news, injuries and the wire for your weak spots…</p>
      )}

      {!scanning && targets && targets.length > 0 && (
        <div className="space-y-2">
          {targets.map(t => {
            const cat = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.streamer;
            const open = openName === t.name;
            return (
              <div key={t.name} className="rounded-xl border border-white/10 bg-white/5">
                <button
                  onClick={() => setOpenName(open ? null : t.name)}
                  className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {t.name} <span className="text-white/40">· {positionLabel(t.position)}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-white/55">{t.why_brief}</p>
                    {t.news_note && (
                      <p className="mt-1 flex items-start gap-1 text-[10px] leading-snug text-amber-200/80">
                        <Newspaper className="mt-0.5 h-3 w-3 shrink-0" /> {t.news_note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cat.cls}`}>
                      {cat.label}
                    </span>
                    {t.priority && (
                      <span className="text-[9px] font-medium uppercase tracking-wider text-white/40">
                        {PRIORITY_LABELS[t.priority] || t.priority}
                      </span>
                    )}
                  </div>
                </button>
                {open && (
                  <div className="space-y-1.5 border-t border-white/10 px-3 py-2 text-[10px] text-white/55">
                    {t.drop_suggestion && <p>If you add him: drop {t.drop_suggestion}</p>}
                    {t.source_url && (
                      <a
                        href={t.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-300 transition-colors hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> {t.source || "Source"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-white/40">Tap a player for the source and a drop idea.</p>
            <button onClick={scan} className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 hover:text-emerald-300">
              Re-scan
            </button>
          </div>
        </div>
      )}

      {!scanning && (!targets || targets.length === 0) && (
        <div className="space-y-2">
          {targets && targets.length === 0 && (
            <p className="text-xs text-white/50">No standout targets right now — check back after injury reports land.</p>
          )}
          {wireList.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">On the wire now</p>
              {wireList.map(fa => (
                <div key={fa.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="truncate text-xs text-white/80">
                    {fa.name} <span className="text-white/40">· {fa.position}</span>
                  </p>
                  <p className="shrink-0 text-[10px] text-white/50">proj {fa.weeklyProj || 0} wk</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-white/40">
            Hit “Scan the wire” for targets picked around your team’s weak spots, hidden gems and injury backups.
          </p>
        </div>
      )}

      {targets && targets.length > 0 && weaknesses.length > 0 && (
        <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-snug text-white/35">
          Scanned against: {weaknesses.slice(0, 3).join(" · ")}
        </p>
      )}
    </section>
  );
}