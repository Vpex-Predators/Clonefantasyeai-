import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles } from "lucide-react";

const MODELS = [
  { id: "automatic", label: "Auto — smart default" },
  { id: "gemini_3_8_flash", label: "Gemini Flash — live web access" },
  { id: "gpt_5_6_luna", label: "GPT Luna" },
  { id: "gpt_5_6_terra", label: "GPT Terra" },
  { id: "gpt_5_6_sol", label: "GPT Sol" },
  { id: "gpt_6_astra", label: "GPT Astra" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { id: "claude_opus_5", label: "Claude Opus 5" },
  { id: "claude_fable_5_1", label: "Claude Fable 5.1" },
  { id: "glm_5_2", label: "GLM 5.2" },
];

export default function AiAnalystPanel({ data }) {
  const [model, setModel] = useState("automatic");
  const [briefing, setBriefing] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("analyzeBriefing", { model });
      setBriefing(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "The analyst could not run right now.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">
        On-demand AI analyst
      </h2>
      <p className="mt-1 text-[11px] text-white/45">
        Live league data plus the latest news, injuries, and QB history — pick your engine.
      </p>

      <div className="mt-3 flex gap-2">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={running}
          className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900 px-2 text-xs font-medium text-white outline-none focus:border-emerald-400/60 disabled:opacity-50"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={running || !data?.locked}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-400 px-4 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {running ? "Analyzing…" : briefing ? "Re-run" : "Run analyst"}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-white/40">
        Premium engines use more AI credits · engines without web access still read live ESPN league data.
      </p>

      {error && (
        <p className="mt-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-xs text-rose-300">{error}</p>
      )}

      {briefing && (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/60 p-3.5 text-sm leading-relaxed text-white/80 [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:text-emerald-300 [&_li]:mt-0.5 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown>{briefing.briefing}</ReactMarkdown>
          <p className="mt-2 text-[10px] text-white/35">
            {briefing.model} · {briefing.webContext ? "with live web context" : "ESPN league data only"} ·{" "}
            {new Date(briefing.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}