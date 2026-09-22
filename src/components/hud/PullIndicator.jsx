import React from "react";
import { Loader2 } from "lucide-react";

// Pull-to-refresh indicator: a small frosted spinner chip that fades in under
// the status bar while the gesture is active, spinning once refreshing starts.
export default function PullIndicator({ pull, refreshing }) {
  if (!refreshing && pull <= 0) return null;
  const progress = Math.min(pull / 60, 1);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2"
      style={{ opacity: refreshing ? 1 : 0.35 + progress * 0.65 }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 backdrop-blur-xl">
        <Loader2
          className={`h-5 w-5 text-emerald-400 ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
      </div>
    </div>
  );
}