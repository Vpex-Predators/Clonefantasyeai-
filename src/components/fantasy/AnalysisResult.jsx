import React from "react";
import { Users, Lightbulb } from "lucide-react";
import RecommendationCard from "@/components/fantasy/RecommendationCard";

const screenTypeLabels = {
  lineup: "Starting Lineup",
  waiver: "Waiver Wire",
  trade: "Trade Offer",
  matchup: "Matchups",
  standings: "Standings",
  other: "Analysis",
};

export default function AnalysisResult({ analysis }) {
  const screenLabel = screenTypeLabels[analysis.screen_type] || screenTypeLabels.other;

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-slate-900 p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-900">
            {screenLabel}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{analysis.summary}</p>
      </div>

      {analysis.players_identified?.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Users className="h-4 w-4" /> Players identified
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.players_identified.map((p, i) => (
              <span key={i} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                {p.name}
                {p.position ? <span className="text-slate-400"> · {p.position}</span> : null}
                {p.team ? <span className="text-slate-400"> · {p.team}</span> : null}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Lightbulb className="h-4 w-4" /> Recommendations
        </h3>
        <div className="space-y-3">
          {analysis.recommendations?.length > 0 ? (
            analysis.recommendations.map((rec, i) => <RecommendationCard key={i} recommendation={rec} />)
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No specific recommendations for this screen.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}