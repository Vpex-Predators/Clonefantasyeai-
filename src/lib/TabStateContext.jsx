import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const TabStateContext = createContext(null);
const TAB_PATHS = ['/', '/waivers', '/warroom', '/dashboard', '/analyst'];

function SessionStore({ scope, children }) {
  const memory = useRef(new Map());
  const location = useLocation();
  const prefix = `fantasyeai:tabs:v1:${scope}:`;
  const read = useCallback((key, initial) => {
    if (memory.current.has(key)) return memory.current.get(key);
    let value;
    try {
      const saved = sessionStorage.getItem(prefix + key);
      if (saved !== null) value = JSON.parse(saved);
    } catch { /* Storage can be unavailable in a WebView. */ }
    if (value === undefined) value = typeof initial === 'function' ? initial() : initial;
    memory.current.set(key, value);
    return value;
  }, [prefix]);
  const write = useCallback((key, value) => {
    memory.current.set(key, value);
    try { sessionStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* Keep the memory fallback. */ }
  }, [prefix]);
  useEffect(() => {
    if (TAB_PATHS.includes(location.pathname)) {
      write(`route:${location.pathname}`, {
        pathname: location.pathname, search: location.search, hash: location.hash,
        state: location.state,
      });
    }
  }, [location, write]);
  const store = useMemo(() => ({ read, write }), [read, write]);
  return <TabStateContext.Provider value={store}>{children}</TabStateContext.Provider>;
}

export function TabStateProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const scope = isAuthenticated && user?.id ? user.id : 'guest';
  // Account changes remount consumers so another user's draft cannot leak into the UI.
  return <SessionStore key={scope} scope={scope}>{children}</SessionStore>;
}

// Persist only user choices/drafts, never passwords, auth tokens, or fetched stats.
export function useTabState(key, initial) {
  const store = useContext(TabStateContext);
  const { pathname } = useLocation();
  const scopedKey = `${pathname}:${key}`;
  const [snapshot, setSnapshot] = useState(() => ({ key: scopedKey, value: store.read(scopedKey, initial) }));
  const value = snapshot.key === scopedKey ? snapshot.value : store.read(scopedKey, initial);
  const update = useCallback(next => {
    const current = store.read(scopedKey, initial);
    const resolved = typeof next === 'function' ? next(current) : next;
    store.write(scopedKey, resolved);
    setSnapshot({ key: scopedKey, value: resolved });
  }, [store.read, store.write, scopedKey, initial]);
  return [value, update];
}

export function useTabNavigation() {
  const store = useContext(TabStateContext);
  return pathname => store.read(`route:${pathname}`, { pathname, search: '', hash: '', state: null });
}
