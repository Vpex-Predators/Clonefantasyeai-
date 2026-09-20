import React, { useEffect, useState } from "react";

// Horizontal edge bar that grows from 0 to `pct` on mount (width transition).
export default function DrawBar({ pct, className = "bg-gradient-to-r from-emerald-400 to-cyan-400" }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const width = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${className}`}
        style={{ width: grown ? `${width}%` : "0%" }}
      />
    </div>
  );
}