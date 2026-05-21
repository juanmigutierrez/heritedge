import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ShieldCheck, Lock, Sparkles, BadgeCheck, Trophy } from "lucide-react";
import { useHuntState } from "./HuntStateProvider";
import huntData from "@/content/treasure-hunt.json";

interface HuntChallenge {
  id: string;
  type: "photo" | "question";
  title: string;
  points: number;
  acceptedAnswers?: string[];
}

const challenges = huntData.challenges as HuntChallenge[];
const badgeSlots = [
  "Duomo Defender",
  "Galleria Guide",
  "Palazzo Patron",
  "Milan Voyager",
];

export function Hunt() {
  const navigate = useNavigate();
  const { state, resetState } = useHuntState();
  const total = challenges.length;
  const completedCount = challenges.filter((challenge) =>
    state.completedChallenges.includes(challenge.id)
  ).length;
  const completionPct = total ? Math.round((completedCount / total) * 100) : 0;
  const allCompleted = completedCount >= total;
  const nextQuestionIndex = Math.min(completedCount, total - 1);
  const retakeQuiz = () => {
    resetState();
    navigate("/treasure-hunt", { state: { currentIndex: 0, answers: [] } });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-10">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold">Hunt Progress</h1>
          <p className="mt-2 text-stone-100/90">
            Track your challenges, badges, and progress across the Milan Heritage experience.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Trophy className="h-10 w-10" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-stone-500">
                  Completed Challenges
                </p>
                <p className="text-3xl font-semibold">{completedCount} / {total}</p>
                <p className="mt-1 text-sm text-stone-600">Completion {completionPct}%</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="w-full h-4 overflow-hidden rounded-full bg-stone-200">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Badges</p>
            <div className="mt-4 grid gap-3">
              {badgeSlots.map((badge) => {
                const earned = state.badges.includes(badge);
                return (
                  <div
                    key={badge}
                    className={`flex items-center justify-between rounded-3xl border px-4 py-3 transition ${
                      earned
                        ? "border-emerald-100 bg-emerald-50 text-emerald-900"
                        : "border-stone-200 bg-stone-50 text-stone-500 blur-[0.3px]"
                    }`}
                  >
                    <span>{badge}</span>
                    {earned ? <BadgeCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Challenge List</p>
              <h2 className="text-2xl font-semibold">Current chapter status</h2>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {completionPct}% complete
              </span>
              {allCompleted ? (
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/souvenir")}
                    className="inline-flex w-full items-center justify-center rounded-3xl border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
                  >
                    Collect Souvenir
                  </button>
                  <button
                    type="button"
                    onClick={retakeQuiz}
                    className="inline-flex w-full items-center justify-center rounded-3xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 sm:w-auto"
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/treasure-hunt", { state: { currentIndex: nextQuestionIndex } })}
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
                >
                  Continue current question
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {challenges.map((challenge, index) => {
              const completed = state.completedChallenges.includes(challenge.id);
              const earnedPoints = completed
                ? state.challengeScores?.[challenge.id] ?? challenge.points
                : challenge.points;
              const unlocked = index <= completedCount;
              return (
                <motion.div
                  key={challenge.id}
                  onClick={() => unlocked && navigate("/treasure-hunt", { state: { currentIndex: index } })}
                  className={`rounded-3xl border p-5 transition ${
                    completed
                      ? "border-emerald-200 bg-emerald-50"
                      : unlocked
                      ? "border-stone-200 bg-white cursor-pointer hover:shadow-lg"
                      : "border-stone-100 bg-stone-50/80 opacity-70"
                  }`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-stone-500 uppercase tracking-[0.22em]">
                        {challenge.type}
                      </p>
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      {completed ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
                          <ShieldCheck className="h-4 w-4" /> Completed
                        </span>
                      ) : unlocked ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                          <Sparkles className="h-4 w-4" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-stone-500">
                          <Lock className="h-4 w-4" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-600">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        completed && earnedPoints === 0
                          ? "bg-red-50 text-red-700"
                          : completed && earnedPoints > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      +{earnedPoints} pts
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1">
                      {challenge.type === "photo"
                        ? "Camera capture"
                        : `${challenge.acceptedAnswers?.length ?? 1} accepted answers`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
