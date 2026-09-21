import React from "react";
import { Loader2 } from "lucide-react";

// Full-height spinner shown while a lazy page chunk loads; `compact` is for
// lazy chunks inside a page (e.g. the season chart) so the layout holds height.
export default function RouteFallback({ compact = false }) {
  return (
    <div className={`flex items-center justify-center ${compact ? "min-h-[240px]" : "min-h-[70vh]"}`}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
    </div>
  );
}