// Lineup slot ordering + labels (QB, RB1, RB2, WR1, WR2, TE, FLEX, DEF, K)
// and injury status badges shared across dashboard components.

const SLOT_RANK = { 0: 0, 2: 1, 4: 2, 6: 3, 23: 4, 7: 5, 3: 6, 5: 7, 16: 8, 17: 9 };
const SLOT_LABEL = { 0: "QB", 2: "RB", 4: "WR", 6: "TE", 23: "FLX", 7: "FLX", 3: "RB", 5: "WR", 16: "D/ST", 17: "K" };

// Sorts starters into standard lineup order and labels them QB / RB1 / RB2 / WR1 / WR2 / TE / FLEX / DEF / K.
export function sortStarters(players) {
  const counts = {};
  const sorted = [...(players || [])].sort(
    (a, b) => (SLOT_RANK[a.slot] ?? 50) - (SLOT_RANK[b.slot] ?? 50)
  );
  return sorted.map(p => {
    const base = SLOT_LABEL[p.slot] || p.position || "FLEX";
    const n = (counts[base] = (counts[base] || 0) + 1);
    const lineupLabel = base === "RB" || base === "WR" ? `${base}${n}` : base;
    return { ...p, lineupLabel };
  });
}

// Maps an ESPN injury status to a compact badge (red Q / O / IR …), or null when healthy.
export function injuryBadge(status) {
  if (!status) return null;
  const s = String(status).toUpperCase();
  if (!s || s === "ACTIVE" || s === "NORMAL") return null;
  if (s === "Q" || s === "QUESTIONABLE") return { label: "Q", title: "Questionable" };
  if (s === "O" || s === "OUT") return { label: "O", title: "Out" };
  if (s === "D" || s === "DOUBTFUL") return { label: "D", title: "Doubtful" };
  if (s === "IR" || s === "INJURY_RESERVE" || s === "PUP") return { label: "IR", title: "Injured reserve" };
  if (s === "SSD") return { label: "S", title: "Suspended" };
  return { label: s, title: status };
}