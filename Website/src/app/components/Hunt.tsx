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
    <div className="min-h-screen bg-background pb-10">
      <div className="bg-accent px-6 py-10 text-accent-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold">Hunt Progress</h1>
          <p className="mt-2 text-accent-foreground/80">
            Track your challenges, badges, and progress across the Milan Heritage experience.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-accent/15 text-accent-strong">
                <Trophy className="h-10 w-10" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Completed Challenges
                </p>
                <p className="text-3xl font-semibold">{completedCount} / {total}</p>
                <p className="mt-1 text-sm text-muted-foreground">Completion {completionPct}%</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="w-full h-4 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Badges</p>
            <div className="mt-4 grid gap-3">
              {badgeSlots.map((badge) => {
                const earned = state.badges.includes(badge);
                return (
                  <div
                    key={badge}
                    className={`flex items-center justify-between rounded-3xl border px-4 py-3 transition ${
                      earned
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground blur-[0.3px]"
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
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Challenge List</p>
              <h2 className="text-2xl font-semibold">Current chapter status</h2>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="rounded-full bg-accent/15 px-4 py-2 text-sm font-semibold text-accent-strong">
                {completionPct}% complete
              </span>
              {allCompleted ? (
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/souvenir")}
                    className="inline-flex w-full items-center justify-center rounded-3xl border border-accent bg-card px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-accent/10 sm:w-auto"
                  >
                    Collect Souvenir
                  </button>
                  <button
                    type="button"
                    onClick={retakeQuiz}
                    className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:w-auto"
                  >
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/treasure-hunt", { state: { currentIndex: nextQuestionIndex } })}
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-accent bg-card px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-accent/10 sm:w-auto"
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
                      ? "border-success/30 bg-success/10"
                      : unlocked
                      ? "border-border bg-card cursor-pointer hover:shadow-lg"
                      : "border-border bg-muted opacity-70"
                  }`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-[0.22em]">
                        {challenge.type}
                      </p>
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {completed ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-success">
                          <ShieldCheck className="h-4 w-4" /> Completed
                        </span>
                      ) : unlocked ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-foreground">
                          <Sparkles className="h-4 w-4" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
                          <Lock className="h-4 w-4" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        completed && earnedPoints === 0
                          ? "bg-destructive/10 text-destructive"
                          : completed && earnedPoints > 0
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      +{earnedPoints} pts
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1">
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
