import { useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock3,
  MapPin,
  Share2,
  Sparkles,
  Trophy,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { useHuntState } from "./HuntStateProvider";
import huntData from "@/content/treasure-hunt.json";

const landmarks = [
  { id: "duomo", name: "Duomo di Milano", icon: "⛪" },
  { id: "galleria", name: "Galleria Vittorio Emanuele II", icon: "🏛️" },
  { id: "palazzo", name: "Palazzo Reale", icon: "🏰" },
];

export function Summary() {
  const navigate = useNavigate();
  const { state, resetState } = useHuntState();
  const challenges = huntData.challenges as Array<{ id: string; points?: number }>;
  const totalChallenges = challenges.length;
  const totalScore = challenges.reduce(
    (sum, challenge) => sum + (challenge.points ?? 0),
    0
  );
  const completedCount = challenges.filter((challenge) =>
    state.completedChallenges.includes(challenge.id)
  ).length;
  const completionPct = totalChallenges
    ? Math.round((completedCount / totalChallenges) * 100)
    : 0;
  const allCompleted = completedCount >= totalChallenges;

  const duration = useMemo(() => {
    const activeElapsed = state.startedAt ? Date.now() - state.startedAt : 0;
    const elapsed = Math.max((state.accumulatedTimeMs ?? 0) + activeElapsed, 0);
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }, [state.startedAt, state.accumulatedTimeMs]);

  const nextQuestionIndex = Math.min(completedCount, totalChallenges - 1);
  const retakeQuiz = () => {
    resetState();
    navigate("/treasure-hunt", { state: { currentIndex: 0, answers: [] } });
  };

  const shareSummary = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "Milan Heritage Completion",
        text: `I scored ${state.score} points and completed ${completionPct}% of the hunt!`,
        url: window.location.href,
      });
    } catch {
      // ignore cancellation
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-accent px-6 py-12 text-accent-foreground">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="rounded-[40px] bg-black/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-accent-foreground/70">
                  Journey complete
                </p>
                <h1 className="mt-3 text-4xl font-semibold">Celebrate your Milan Heritage story</h1>
                <p className="mt-3 max-w-2xl text-accent-foreground/80">
                  Your final reward is ready — review your stats, watch your souvenir reveal, and share the experience.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-3xl bg-black/10 px-5 py-4 text-sm text-accent-foreground">
                <Sparkles className="h-5 w-5" />
                {completionPct}% complete
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[36px] bg-card border border-border p-8 shadow-sm h-full"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-accent-strong">
                  Score Hero
                </p>
                <h2 className="mt-3 text-4xl font-semibold text-foreground">
                  {state.score}/{totalScore}
                </h2>
              </div>
              <div className="rounded-3xl bg-accent/15 px-4 py-3 text-sm font-semibold text-accent-strong">
                {completedCount} / {totalChallenges} challenges
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-muted p-4 text-center">
                <Clock3 className="mx-auto h-6 w-6 text-accent-strong" />
                <p className="mt-3 text-sm text-muted-foreground">Time spent</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{duration}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted p-4 text-center">
                <MapPin className="mx-auto h-6 w-6 text-accent-strong" />
                <p className="mt-3 text-sm text-muted-foreground">Stops visited</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{state.visitedStops.length}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted p-4 text-center">
                <BadgeCheck className="mx-auto h-6 w-6 text-accent-strong" />
                <p className="mt-3 text-sm text-muted-foreground">Badges earned</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{state.badges.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[36px] bg-card border border-border p-8 shadow-sm h-full"
          >
            <h2 className="text-xl font-semibold text-foreground">Badges earned</h2>
            <div className="mt-5 grid gap-4">
              {state.badges.length > 0 ? (
                state.badges.map((badge) => (
                  <div key={badge} className="rounded-3xl bg-success/10 p-4 text-foreground">
                    <p className="font-semibold">{badge}</p>
                    <p className="mt-1 text-sm text-muted-foreground">A reward for the progress you unlocked on the route.</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No badges earned yet. Keep going to unlock the first one.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[36px] bg-card border border-border p-8 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-foreground">Souvenir Polaroid</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your final keepsake from the Milan Heritage trail.
            </p>
            <div className="mt-6 flex flex-col items-center gap-5 rounded-[32px] border border-border bg-muted p-6">
              {state.souvenirImage ? (
                <motion.img
                  src={state.souvenirImage}
                  alt="Souvenir polaroid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="w-full rounded-[28px] border border-border object-cover max-w-md"
                />
              ) : (
                <div className="grid h-72 w-full max-w-md place-items-center rounded-[28px] border border-dashed border-border bg-card text-muted-foreground">
                  <p className="text-center">No souvenir captured yet. Visit the filter station to create your polaroid.</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid gap-6">
            <div className="rounded-[36px] bg-card border border-border p-8 shadow-sm h-full">
              <h2 className="text-xl font-semibold text-foreground">Share your journey</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Share your score and completion percentage with friends.
              </p>
              <button
                type="button"
                onClick={shareSummary}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-accent px-6 py-4 text-sm font-semibold text-accent-foreground transition hover:opacity-90 sm:w-auto"
              >
                <Share2 className="h-5 w-5" />
                Share Experience
              </button>
              {allCompleted ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/souvenir")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-accent bg-card px-6 py-4 text-sm font-semibold text-accent-strong transition hover:bg-accent/10 sm:w-auto"
                  >
                    Collect Souvenir
                  </button>
                  <button
                    type="button"
                    onClick={retakeQuiz}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/treasure-hunt", { state: { currentIndex: nextQuestionIndex } })}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-accent bg-card px-6 py-4 text-sm font-semibold text-accent-strong transition hover:bg-accent/10 sm:w-auto"
                >
                  Continue Hunt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
