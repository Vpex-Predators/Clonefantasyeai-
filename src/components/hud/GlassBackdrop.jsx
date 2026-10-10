import React from "react";

export default function GlassBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07110f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(52,211,153,0.15),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(34,211,238,0.10),transparent_26%),linear-gradient(180deg,#07110f_0%,#08100f_46%,#050908_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.025] to-transparent" />
      <div className="hud-grid absolute inset-0 opacity-30" />
    </div>
  );
}
