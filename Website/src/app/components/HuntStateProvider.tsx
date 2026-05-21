import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface HuntState {
  score: number;
  completedChallenges: string[];
  challengeScores: Record<string, number>;
  visitedStops: string[];
  badges: string[];
  souvenirImage?: string;
  startedAt?: number;
  accumulatedTimeMs: number;
}

interface HuntStateContext {
  state: HuntState;
  ready: boolean;
  completeChallenge: (
    id: string,
    points: number,
    stopId?: string,
    badge?: string
  ) => void;
  visitStop: (stopId: string) => void;
  addBadge: (name: string) => void;
  setSouvenirImage: (image: string) => void;
  startHunt: () => void;
  pauseHunt: () => void;
  resetState: () => void;
}

const HUNT_STATE_KEY = "hunt-state";
const defaultState: HuntState = {
  score: 0,
  completedChallenges: [],
  challengeScores: {},
  visitedStops: [],
  badges: [],
  souvenirImage: undefined,
  accumulatedTimeMs: 0,
};

const HuntStateContext = createContext<HuntStateContext | null>(null);

export function HuntProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HuntState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(HUNT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<HuntState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          challengeScores: parsed.challengeScores ?? prev.challengeScores,
          startedAt: parsed.startedAt ?? prev.startedAt,
          accumulatedTimeMs: parsed.accumulatedTimeMs ?? prev.accumulatedTimeMs,
        }));
      }
    } catch (error) {
      console.error("Failed to load hunt state:", error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HUNT_STATE_KEY, JSON.stringify(state));
  }, [state]);

  const completeChallenge = (
    id: string,
    points: number,
    stopId?: string,
    badge?: string
  ) => {
    setState((current) => {
      if (current.completedChallenges.includes(id)) {
        return current;
      }

      const nextBadges = badge
        ? current.badges.includes(badge)
          ? current.badges
          : [...current.badges, badge]
        : current.badges;

      const nextVisitedStops = stopId
        ? current.visitedStops.includes(stopId)
          ? current.visitedStops
          : [...current.visitedStops, stopId]
        : current.visitedStops;

      return {
        ...current,
        score: current.score + points,
        completedChallenges: [...current.completedChallenges, id],
        challengeScores: {
          ...current.challengeScores,
          [id]: points,
        },
        visitedStops: nextVisitedStops,
        badges: nextBadges,
      };
    });
  };

  const visitStop = (stopId: string) => {
    setState((current) => {
      if (current.visitedStops.includes(stopId)) return current;
      return {
        ...current,
        visitedStops: [...current.visitedStops, stopId],
      };
    });
  };

  const addBadge = (name: string) => {
    setState((current) => {
      if (current.badges.includes(name)) return current;
      return {
        ...current,
        badges: [...current.badges, name],
      };
    });
  };

  const setSouvenirImage = (image: string) => {
    setState((current) => ({
      ...current,
      souvenirImage: image,
    }));
  };

  const startHunt = () => {
    setState((current) => {
      if (current.startedAt) return current;
      return {
        ...current,
        startedAt: Date.now(),
      };
    });
  };

  const pauseHunt = () => {
    setState((current) => {
      if (!current.startedAt) return current;
      return {
        ...current,
        accumulatedTimeMs: current.accumulatedTimeMs + (Date.now() - current.startedAt),
        startedAt: undefined,
      };
    });
  };

  const resetState = () => {
    setState(() => ({
      ...defaultState,
      accumulatedTimeMs: 0,
    }));
  };

  const contextValue = useMemo(
    () => ({
      state,
      ready,
      completeChallenge,
      visitStop,
      addBadge,
      setSouvenirImage,
      startHunt,
      pauseHunt,
      resetState,
    }),
    [state, ready]
  );

  return (
    <HuntStateContext.Provider value={contextValue}>
      {children}
    </HuntStateContext.Provider>
  );
}

export function useHuntState() {
  const context = useContext(HuntStateContext);
  if (!context) {
    throw new Error("useHuntState must be used within a HuntProvider");
  }
  return context;
}
