import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

export default function ScoringTrend({ trend }) {
  const data = (trend || []).filter(t => t.points > 0);
  const avg = data.length ? (data.reduce((s, d) => s + d.points, 0) / data.length).toFixed(1) : "—";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">Scoring trend</h2>
        <span className="text-[10px] text-white/40">{avg} pts/gm</span>
      </div>
      {data.length < 2 ? (
        <p className="py-8 text-center text-xs text-white/50">Not enough games yet — the trend chart appears after week 1.</p>
      ) : (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                labelFormatter={w => `Week ${w}`}
                formatter={v => [v + " pts", "Score"]}
              />
              <Area type="monotone" dataKey="points" stroke="#34d399" strokeWidth={2} fill="url(#scoreFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}