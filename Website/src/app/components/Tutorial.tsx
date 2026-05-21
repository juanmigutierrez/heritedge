import { useState } from "react";
import { motion } from "motion/react";

const tutorialScreens = [
  {
    title: "Explore Milan",
    description:
      "Discover historic landmarks, learn the stories behind them, and follow a guided path through the heart of the city.",
  },
  {
    title: "AR + Story",
    description:
      "Use immersive augmented reality to see how the Duomo and Galleria changed over time, and unlock hidden narrative layers.",
  },
  {
    title: "Hunt + Rewards",
    description:
      "Answer questions, solve audio and video clues, then capture your souvenir with a Milan-themed camera filter.",
  },
];

export function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [page, setPage] = useState(0);
  const isLast = page === tutorialScreens.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    setPage((current) => Math.min(current + 1, tutorialScreens.length - 1));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-xl flex-col gap-8 rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
            Welcome to Milan Heritage
          </p>
          <h1 className="text-4xl font-semibold">Get ready for your journey</h1>
          <p className="text-stone-300">
            Learn how to navigate the experience, unlock challenges, and collect your final souvenir.
          </p>
        </div>

        <motion.div
          key={page}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[32px] bg-stone-900/90 p-8 shadow-inner"
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm text-emerald-200">Step {page + 1} of {tutorialScreens.length}</span>
            <button
              type="button"
              onClick={onFinish}
              className="text-sm font-semibold text-stone-100 hover:text-white"
            >
              Skip
            </button>
          </div>

          <h2 className="text-3xl font-semibold">{tutorialScreens[page].title}</h2>
          <p className="mt-4 text-stone-300 leading-7">
            {tutorialScreens[page].description}
          </p>
        </motion.div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-3 rounded-full bg-emerald-400 transition-all"
              style={{ width: `${((page + 1) / tutorialScreens.length) * 100}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
