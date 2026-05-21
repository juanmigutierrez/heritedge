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
  const challenges = huntData.challenges as Array<{ id: string; rewardPoints?: number }>;
  const totalChallenges = challenges.length;
  const totalScore = challenges.reduce(
    (sum, challenge) => sum + (challenge.rewardPoints ?? 0),
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
    <div className="min-h-screen bg-stone-50">
      <div className="bg-gradient-to-b from-emerald-700 to-slate-900 px-6 py-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          <div className="rounded-[40px] bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
                  Journey complete
                </p>
                <h1 className="mt-3 text-4xl font-semibold">Celebrate your Milan Heritage story</h1>
                <p className="mt-3 max-w-2xl text-stone-200">
                  Your final reward is ready — review your stats, watch your souvenir reveal, and share the experience.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-3xl bg-white/10 px-5 py-4 text-sm text-white">
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
            className="rounded-[36px] bg-white p-8 shadow-sm h-full"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-500">
                  Score Hero
                </p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">
                  {state.score}/{totalScore}
                </h2>
              </div>
              <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {completedCount} / {totalChallenges} challenges
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-center">
                <Clock3 className="mx-auto h-6 w-6 text-emerald-600" />
                <p className="mt-3 text-sm text-stone-500">Time spent</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{duration}</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-center">
                <MapPin className="mx-auto h-6 w-6 text-emerald-600" />
                <p className="mt-3 text-sm text-stone-500">Stops visited</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{state.visitedStops.length}</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-center">
                <BadgeCheck className="mx-auto h-6 w-6 text-emerald-600" />
                <p className="mt-3 text-sm text-stone-500">Badges earned</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{state.badges.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[36px] bg-white p-8 shadow-sm h-full"
          >
            <h2 className="text-xl font-semibold text-slate-900">Badges earned</h2>
            <div className="mt-5 grid gap-4">
              {state.badges.length > 0 ? (
                state.badges.map((badge) => (
                  <div key={badge} className="rounded-3xl bg-emerald-50 p-4 text-slate-900">
                    <p className="font-semibold">{badge}</p>
                    <p className="mt-1 text-sm text-slate-700">A reward for the progress you unlocked on the route.</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-stone-300 p-6 text-center text-stone-500">
                  No badges earned yet. Keep going to unlock the first one.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[36px] bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">Souvenir Polaroid</h2>
            <p className="mt-3 text-sm text-stone-500">
              Your final keepsake from the Milan Heritage trail.
            </p>
            <div className="mt-6 flex flex-col items-center gap-5 rounded-[32px] border border-stone-200 bg-stone-50 p-6">
              {state.souvenirImage ? (
                <motion.img
                  src={state.souvenirImage}
                  alt="Souvenir polaroid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="w-full rounded-[28px] border border-stone-200 object-cover max-w-md"
                />
              ) : (
                <div className="grid h-72 w-full max-w-md place-items-center rounded-[28px] border border-dashed border-stone-300 bg-white text-stone-500">
                  <p className="text-center">No souvenir captured yet. Visit the filter station to create your polaroid.</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid gap-6">
            <div className="rounded-[36px] bg-white p-8 shadow-sm h-full">
              <h2 className="text-xl font-semibold text-slate-900">Share your journey</h2>
              <p className="mt-3 text-sm text-stone-500">
                Share your score and completion percentage with friends.
              </p>
              <button
                type="button"
                onClick={shareSummary}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
              >
                <Share2 className="h-5 w-5" />
                Share Experience
              </button>
              {allCompleted ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/souvenir")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-emerald-600 bg-white px-6 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
                  >
                    Collect Souvenir
                  </button>
                  <button
                    type="button"
                    onClick={retakeQuiz}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-stone-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-stone-800 sm:w-auto"
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/treasure-hunt", { state: { currentIndex: nextQuestionIndex } })}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-emerald-600 bg-white px-6 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
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
