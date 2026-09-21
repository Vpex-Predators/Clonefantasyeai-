import { useCallback, useEffect, useRef, useState } from "react";

// Native-style pull-to-refresh: drag down from the very top of the page to
// trigger `onRefresh` (the page's existing refresh/scan handler). The gesture
// only arms when the page is scrolled to the top, and never fights inner
// scrolling — the bottom nav is untouched.
export default function usePullToRefresh(onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  const finish = useCallback(async () => {
    startY.current = null;
    const shouldRefresh = pullRef.current >= 60 && !refreshingRef.current;
    pullRef.current = 0;
    setPull(0);
    if (shouldRefresh) {
      refreshingRef.current = true;
      setRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  useEffect(() => {
    const onTouchStart = (e) => {
      startY.current =
        refreshingRef.current || window.scrollY > 0 ? null : e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      pullRef.current = Math.min(dy * 0.45, 70);
      setPull(pullRef.current);
    };
    const onTouchEnd = () => {
      if (startY.current != null) finish();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [finish]);

  return { pull, refreshing };
}