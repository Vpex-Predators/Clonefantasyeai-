// Shared player-name abbreviation:
//   "Joshua Chase"   -> "J. Chase"
// Surname collisions ("JaMynn Chase" vs "Joshua Chase") disambiguate as
// first name's first 3 letters + middle initial + surname -> "JosA. Chase".
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v", "jr.", "sr."]);

// Detects already-abbreviated first tokens like "A.J." or "J.".
const isInitialForm = (token) => /^[A-Z]\.?([A-Z]\.?)+$/.test(token);

function parseName(full) {
  const tokens = String(full || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);
  const parts = tokens.filter((t) => !SUFFIXES.has(t.toLowerCase()));
  if (!parts.length) return { first: "", middles: [], surname: String(full || "").trim() };
  return {
    first: parts[0],
    middles: parts.slice(1, -1),
    surname: parts[parts.length - 1],
  };
}

// First name's first 3 letters + middle initials + surname — the collision form.
function longForm(p) {
  if (isInitialForm(p.first)) return `${p.first} ${p.surname}`;
  const middles = p.middles.map((m) => m.replace(".", "").toUpperCase()).join("");
  return `${p.first.slice(0, 3)}${middles}. ${p.surname}`;
}

// First initial + surname — the default compact form.
function shortForm(p) {
  if (isInitialForm(p.first)) return `${p.first} ${p.surname}`;
  return `${p.first.slice(0, 1)}. ${p.surname}`;
}

// Given a list of full names, returns a map of full name -> compact label.
// Players sharing a surname get the longer distinguishable form.
export function buildShortNames(names) {
  const uniq = [...new Set((names || []).filter(Boolean))];
  const parsed = {};
  const surnameCount = {};
  for (const n of uniq) {
    const p = parseName(n);
    parsed[n] = p;
    surnameCount[p.surname] = (surnameCount[p.surname] || 0) + 1;
  }
  const map = {};
  for (const n of uniq) {
    const p = parsed[n];
    map[n] = surnameCount[p.surname] > 1 ? longForm(p) : shortForm(p);
  }
  return map;
}

// Fallback for names with no surrounding context: plain first-initial form.
export function shortName(full) {
  return shortForm(parseName(full));
}