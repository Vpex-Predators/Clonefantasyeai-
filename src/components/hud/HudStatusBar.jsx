import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TAB_ROOTS = ["/", "/waivers", "/warroom", "/dashboard", "/analyst"];

export default function HudStatusBar({ title, sub, tag = "LIVE" }) {
  const { pathname } = useLocation();
  const isTabRoot = TAB_ROOTS.includes(pathname);
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/");
  };

  const live = tag === "LIVE";

  return (
    <header className="app-topbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {!isTabRoot ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="no-callout flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-cyan-300 text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,0.14)]">
              <Sparkles className="h-4 w-4" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate font-heading text-base font-bold leading-tight text-white sm:text-lg">{title}</h1>
            {sub && <p className="mt-0.5 truncate text-sm text-white/55">{sub}</p>}
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white/75">
          <span className={"h-2 w-2 rounded-full " + (live ? "animate-pulse bg-emerald-400" : "bg-white/35")} />
          {tag}
        </span>
      </div>
    </header>
  );
}
