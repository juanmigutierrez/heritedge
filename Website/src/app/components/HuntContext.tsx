import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import huntData from "@/content/treasure-hunt.json";

const STORAGE_KEY = "heritedge.huntState";

export type HuntChallengeId = string;

export interface HuntState {
  completedChallenges: HuntChallengeId[];
  score: number;
  badges: string[];
  visitedStops: string[];
  souvenirImage?: string;
  startedAt: number;
}

export interface HuntContextValue extends HuntState {
  totalChallenges: number;
  completionPercent: number;
  markedVisited: (stopId: string) => void;
  markChallengeComplete: (challengeId: HuntChallengeId, points: number) => void;
  setSouvenirImage: (imageDataUrl: string) => void;
  resetHunt: () => void;
}

const defaultState: HuntState = {
  completedChallenges: [],
  score: 0,
  badges: [],
  visitedStops: [],
  souvenirImage: undefined,
  startedAt: Date.now(),
};

const HuntContext = createContext<HuntContextValue | undefined>(undefined);

function loadState(): HuntState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as HuntState;
    return {
      ...defaultState,
      ...parsed,
      startedAt: parsed.startedAt || defaultState.startedAt,
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: HuntState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore localStorage failures
  }
}

function getBadges(completedCount: number) {
  const badges: string[] = [];
  if (completedCount >= 1) badges.push("First Steps");
  if (completedCount >= 3) badges.push("Curious Explorer");
  if (completedCount >= 5) badges.push("History Hunter");
  if (completedCount >= 8) badges.push("Duomo Master");
  return badges;
}

export function HuntProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HuntState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const totalChallenges = useMemo(() => {
    return Array.isArray(huntData.challenges) ? huntData.challenges.length : 0;
  }, []);

  const completionPercent = useMemo(() => {
    return totalChallenges === 0
      ? 0
      : Math.round((state.completedChallenges.length / totalChallenges) * 100);
  }, [state.completedChallenges.length, totalChallenges]);

  const markedVisited = (stopId: string) => {
    setState((prev) => {
      if (prev.visitedStops.includes(stopId)) return prev;
      return { ...prev, visitedStops: [...prev.visitedStops, stopId] };
    });
  };

  const markChallengeComplete = (challengeId: HuntChallengeId, points: number) => {
    setState((prev) => {
      if (prev.completedChallenges.includes(challengeId)) {
        return prev;
      }
      const completedChallenges = [...prev.completedChallenges, challengeId];
      const badges = getBadges(completedChallenges.length);
      return {
        ...prev,
        completedChallenges,
        score: prev.score + points,
        badges,
      };
    });
  };

  const setSouvenirImage = (imageDataUrl: string) => {
    setState((prev) => ({ ...prev, souvenirImage: imageDataUrl }));
  };

  const resetHunt = () => {
    setState({ ...defaultState, startedAt: Date.now() });
  };

  const value: HuntContextValue = {
    ...state,
    totalChallenges,
    completionPercent,
    markedVisited,
    markChallengeComplete,
    setSouvenirImage,
    resetHunt,
  };

  return <HuntContext.Provider value={value}>{children}</HuntContext.Provider>;
}

export function useHunt() {
  const context = useContext(HuntContext);
  if (!context) {
    throw new Error("useHunt must be used within a HuntProvider");
  }
  return context;
}
