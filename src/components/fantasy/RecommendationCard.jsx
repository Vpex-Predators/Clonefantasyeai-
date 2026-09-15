import React from "react";

const confidenceStyles = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-slate-100 text-slate-600 border-slate-300",
};

export default function RecommendationCard({ recommendation }) {
  const style = confidenceStyles[recommendation.confidence] || confidenceStyles.low;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="font-heading font-semibold text-slate-900">{recommendation.player}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{recommendation.reasoning}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
          {recommendation.action}
        </span>
        <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium capitalize ${style}`}>
          {recommendation.confidence}
        </span>
      </div>
    </div>
  );
}