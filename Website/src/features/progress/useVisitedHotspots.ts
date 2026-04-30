// useVisitedHotspots — tracks which hotspot ids the user has opened.
// Owner: P3 (detailed view).
//
// Persists to localStorage so progress survives reloads. Cross-tab updates
// flow through the `storage` event so two open tabs stay in sync.
//
// To replace localStorage with a backend: keep the (visited, isVisited,
// markVisited, reset) shape and swap the read/write internals. The view
// only depends on the shape.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "heritedge:hotspots:visited";

/** Map of hotspot id → ISO timestamp of first visit. */
export type VisitedMap = Record<string, string>;

const readStorage = (): VisitedMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisitedMap) : {};
  } catch {
    return {};
  }
};

const writeStorage = (next: VisitedMap) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — silent */
  }
};

export interface UseVisitedHotspots {
  visited: VisitedMap;
  isVisited: (id: string) => boolean;
  markVisited: (id: string) => void;
  reset: () => void;
}

export function useVisitedHotspots(): UseVisitedHotspots {
  const [visited, setVisited] = useState<VisitedMap>(readStorage);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setVisited(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markVisited = useCallback((id: string) => {
    setVisited((prev) => {
      if (prev[id]) return prev;
      const next: VisitedMap = { ...prev, [id]: new Date().toISOString() };
      writeStorage(next);
      return next;
    });
  }, []);

  const isVisited = useCallback(
    (id: string) => Boolean(visited[id]),
    [visited]
  );

  const reset = useCallback(() => {
    setVisited({});
    writeStorage({});
  }, []);

  return { visited, isVisited, markVisited, reset };
}
