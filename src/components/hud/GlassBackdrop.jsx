import React from "react";
import { Image } from "@/components/ui/image";

const HERO_IMAGE_URL = "https://media.base44.com/images/public/6aa483eab525018797301877/e625f56d3_generated_image.png";

// Ambient futuristic backdrop — holographic field art, drifting aurora glows, faint HUD grid.
export default function GlassBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-950">
      <Image
        src={HERO_IMAGE_URL}
        fittingType="fill"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute -left-28 -top-32 h-80 w-80 animate-float-slow rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-28 top-1/3 h-72 w-72 animate-float-slow rounded-full bg-cyan-500/15 blur-3xl [animation-delay:-6s]" />
      <div className="absolute -bottom-28 left-1/4 h-72 w-72 animate-float-slow rounded-full bg-rose-500/10 blur-3xl [animation-delay:-11s]" />
      <div className="hud-grid absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/55 to-slate-950/85" />
    </div>
  );
}