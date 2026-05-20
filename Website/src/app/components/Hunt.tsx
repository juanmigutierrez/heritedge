import { Link } from "react-router";
import { motion } from "motion/react";
import { Compass, Sparkles, Trophy, CheckCircle2, ChevronRight } from "lucide-react";
import { useHunt } from "./HuntContext";
import huntData from "@/content/treasure-hunt.json";

export function Hunt() {
  const {
    completedChallenges,
    score,
    badges,
    visitedStops,
    totalChallenges,
    completionPercent,
  } = useHunt();

  const completedCount = completedChallenges.length;
  const remainingCount = Math.max(totalChallenges - completedCount, 0);

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <div className="bg-gradient-to-b from-emerald-700 to-slate-950 px-6 pt-12 pb-10 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-emerald-200">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Compass className="h-5 w-5" />
            </span>
            Heritage Hunt Tracker
          </div>
          <h1 className="text-3xl font-semibold">Your hunt progress</h1>
          <p className="mt-3 max-w-2xl text-sm text-emerald-100">
            Follow the route, collect clues, and unlock a souvenir at the finish line.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-10 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Adventure score</p>
              <p className="mt-2 text-4xl font-semibold text-slate-950">{score}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-2 sm:text-left">
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                <p className="text-2xl font-semibold">{completedCount}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">Completed</p>
              </div>
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                <p className="text-2xl font-semibold">{remainingCount}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">Remaining</p>
              </div>
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700 sm:col-span-2">
                <p className="text-2xl font-semibold">{completionPercent}%</p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">Progress</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Badges earned</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Your explorer rank</h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {badges.length} badges
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-900"
                >
                  {badge}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">Complete your first challenge to unlock badges.</p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Route status</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">Stops visited</h2>
            </div>
            <span className="text-sm text-slate-500">{visitedStops.length} locations</span>
          </div>

          <div className="mt-5 grid gap-3">
            {visitedStops.length > 0 ? (
              visitedStops.map((stopId) => (
                <div key={stopId} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {stopId}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Your path will fill in as you complete each challenge.</p>
            )}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-[2rem] border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Challenge list</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">What's next</h2>
            </div>
            <Link
              to="/treasure-hunt"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {huntData.challenges.map((challenge) => {
              const done = completedChallenges.includes(challenge.id.toString());
              return (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{challenge.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{challenge.landmark} • {challenge.type}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {done ? "Done" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
