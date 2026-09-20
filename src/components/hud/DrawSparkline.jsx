import React from "react";

// Sparkline whose path draws itself on mount (stroke-dashoffset animation).
export default function DrawSparkline({ points, className = "h-4 w-14 text-emerald-400/80" }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points.map(p => p.points), 1);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 60},${18 - (p.points / max) * 16}`)
    .join(" ");
  return (
    <svg viewBox="0 0 60 18" className={className} preserveAspectRatio="none">
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ strokeDasharray: 120 }}
        className="animate-draw-line"
      />
    </svg>
  );
}