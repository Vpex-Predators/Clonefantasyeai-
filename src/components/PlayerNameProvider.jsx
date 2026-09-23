import React, { createContext, useContext, useMemo } from "react";
import { buildShortNames, shortName } from "@/lib/playerNames";

// Pages wrap their content in this provider with every player name they render,
// so surname collisions inside that context get the distinguishable long form.
const PlayerNameContext = createContext(null);

export function PlayerNameProvider({ names = [], children }) {
  const value = useMemo(() => buildShortNames(names), [names]);
  return <PlayerNameContext.Provider value={value}>{children}</PlayerNameContext.Provider>;
}

// Returns a lookup fn: short(fullName). Falls back to the plain first-initial
// form when no provider is mounted.
export function usePlayerNames() {
  const map = useContext(PlayerNameContext);
  return (name) => (map && map[name]) || shortName(name);
}