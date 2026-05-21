import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Trophy, Sparkles } from "lucide-react";
import { useHuntState } from "./HuntStateProvider";
import { HuntQuestion } from "./HuntQuestion";
import huntData from "@/content/treasure-hunt.json";

interface HuntChallenge {
  id: string;
  type: "quiz" | "ar" | "audio" | "video";
  title: string;
  question: string;
  options: string[];
  answer: string;
  rewardPoints: number;
  mediaSrc?: string;
  mediaLabel?: string;
}

const challenges = huntData.challenges as HuntChallenge[];

export function TreasureHunt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, completeChallenge, visitStop, startHunt, pauseHunt } = useHuntState();
  const completedCount = challenges.filter((challenge) =>
    state.completedChallenges.includes(challenge.id)
  ).length;

  useEffect(() => {
    startHunt();
    return () => {
      pauseHunt();
    };
  }, []);

  const routeIndex = location.state?.currentIndex;
  const routeAnswers = Array.isArray(location.state?.answers)
    ? (location.state.answers as boolean[])
    : [];
  const nextAvailableIndex = Math.min(completedCount, challenges.length - 1);

  const [currentIndex, setCurrentIndex] = useState(() =>
    typeof routeIndex === "number" && routeIndex >= 0 && routeIndex < challenges.length
      ? routeIndex
      : nextAvailableIndex
  );
  const [answers, setAnswers] = useState<boolean[]>(routeAnswers);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (typeof routeIndex === "number" && routeIndex >= 0 && routeIndex < challenges.length) {
      setCurrentIndex(routeIndex);
    }
    if (routeAnswers.length) {
      setAnswers(routeAnswers);
    }
  }, [routeIndex, routeAnswers]);

  const current = challenges[currentIndex];
  const isCompleted = state.completedChallenges.includes(current.id);
  const progressPct = Math.round((completedCount / challenges.length) * 100);

  useEffect(() => {
    if (!justCompleted) return;
    const timer = window.setTimeout(() => setJustCompleted(false), 900);
    return () => window.clearTimeout(timer);
  }, [justCompleted]);

  const mediaBlock = useMemo(() => {
    if (!current.mediaSrc) return null;
    if (current.type === "audio") {
      return (
        <audio controls className="w-full rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <source src={current.mediaSrc} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
      );
    }
    if (current.type === "video") {
      return (
        <video
          controls
          src={current.mediaSrc}
          className="w-full rounded-3xl border border-stone-200 bg-black"
        />
      );
    }
    return null;
  }, [current.mediaSrc, current.type]);

  const handleComplete = (isCorrect: boolean) => {
    const nextAnswers = [...answers, isCorrect];
    const badgeLabel =
      current.type === "audio"
        ? "Audio Listener"
        : current.type === "video"
        ? "Video Storyteller"
        : current.type === "ar"
        ? "AR Explorer"
        : "Quiz Solver";
    if (!isCompleted) {
      completeChallenge(
        current.id,
        isCorrect ? current.rewardPoints : 0,
        current.id,
        isCorrect ? badgeLabel : undefined
      );
      visitStop(current.id);
    }

    if (currentIndex < challenges.length - 1) {
      navigate("/quiz-feedback", {
        state: {
          isCorrect,
          questionIndex: currentIndex,
          totalQuestions: challenges.length,
          answers: nextAnswers,
          correctAnswer: current.answer,
        },
      });
      return;
    }

    if (currentIndex === challenges.length - 1) {
      // Final question still shows feedback before the user moves to the summary.
      navigate("/quiz-feedback", {
        state: {
          isCorrect,
          questionIndex: currentIndex,
          totalQuestions: challenges.length,
          answers: nextAnswers,
          correctAnswer: current.answer,
          final: true,
        },
      });
      return;
    }

    navigate("/summary", { state: { answers: nextAnswers, completedQuiz: true } });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-10">
      <div className="bg-gradient-to-r from-emerald-700 to-slate-900 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold">Treasure Hunt</h1>
          <p className="mt-2 text-stone-200">
            Track your current challenge and progress through the Milan Heritage experience.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        <div className="rounded-[36px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Progress</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{progressPct}% complete</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {state.score} pts
            </div>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-stone-200">
            <motion.div
              className="h-full rounded-full bg-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-[36px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
                  {current.type.toUpperCase()} challenge
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">{current.title}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <Trophy className="h-4 w-4" /> +{current.rewardPoints} pts
              </div>
            </div>

            <p className="mt-4 text-stone-600">{current.question}</p>
            {current.mediaLabel && (
              <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold">Hint:</span> {current.mediaLabel}
              </div>
            )}

            <div className="mt-6">{mediaBlock}</div>
          </div>

          <HuntQuestion
            id={current.id}
            question={current.question}
            options={current.options}
            correct={current.answer}
            rewardPoints={current.rewardPoints}
            onComplete={handleComplete}
          />

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Challenge already completed</p>
                  <p className="text-sm text-emerald-800">
                    You already earned this reward. Move to the next challenge.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {justCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[32px] bg-slate-900 p-5 text-white"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Nice work!</p>
                  <p className="text-sm text-stone-200">
                    Your answer was recorded. {currentIndex < challenges.length - 1 ? "Next challenge appears soon." : "Redirecting to summary..."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="rounded-[32px] border border-stone-200 bg-white p-6 text-sm text-stone-600">
            <p>
              Completed {completedCount} of {challenges.length} challenges.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/hunt")}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800 sm:w-auto"
              >
                View Tracker
              </button>
              <button
                type="button"
                onClick={() => navigate("/summary")}
                className="inline-flex w-full items-center justify-center rounded-3xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-stone-50 sm:w-auto"
              >
                Go to Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
