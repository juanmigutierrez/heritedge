import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Check,
  Compass,
  Camera,
  Sparkles,
  Volume2,
  Trophy,
} from "lucide-react";

import exploreMilanImg from "../../assets/Explore_Milan.png";
import storyArImg from "../../assets/Story_&_AR.png";
import gamifiedHuntImg from "../../assets/Gamified_Hunt.png";

const tutorialScreens = [
  {
    id: 1,
    eyebrow: "Discover",
    title: "Explore Milan",
    subtitle: "Walk through the city's cultural heartbeat",
    description:
      "Discover historic landmarks, uncover hidden stories, explore centuries of Milanese culture, and follow immersive guided routes through the city's most iconic streets.",
    icon: Compass,
    accent: "from-emerald-400 to-teal-500",
    image: exploreMilanImg,
    imageLabel: "IMAGE 1",
    highlights: [
      "Interactive city map",
      "Landmark storytelling",
      "Smart guided routes",
    ],
  },
  {
    id: 2,
    eyebrow: "Experience",
    title: "AR + Storytelling",
    subtitle: "See Milan through time",
    description:
      "Use immersive augmented reality to visualize historical transformations, connect present-day Piazza Duomo with its past, and unlock hidden narrative layers behind each landmark.",
    icon: Sparkles,
    accent: "from-violet-400 to-fuchsia-500",
    image: storyArImg,
    imageLabel: "IMAGE 2",
    highlights: [
      "Augmented reality scenes",
      "Spatial audio narration",
      "Historic overlays",
    ],
  },
  {
    id: 3,
    eyebrow: "Play",
    title: "Challenges + Rewards",
    subtitle: "Turn exploration into a game",
    description:
      "Solve clues, answer interactive questions, collect points for each discovery, and unlock a personalized Milan souvenir experience that celebrates your journey through the city.",
    icon: Trophy,
    accent: "from-amber-400 to-orange-500",
    image: gamifiedHuntImg,
    imageLabel: "IMAGE 3",
    highlights: [
      "Treasure hunt mechanics",
      "Audio & video clues",
      "AR camera souvenirs",
    ],
  },
];

export function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [page, setPage] = useState(0);

  const isLast = page === tutorialScreens.length - 1;
  const progress = ((page + 1) / tutorialScreens.length) * 100;

  const currentScreen = useMemo(() => tutorialScreens[page], [page]);

  const handleNext = () => {
    if (isLast) {
      onFinish();
      return;
    }

    setPage((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B0D] text-white">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-7xl overflow-hidden rounded-[40px] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-2xl">
          <div className="grid min-h-[760px] grid-cols-1 lg:grid-cols-2">
            {/* LEFT SECTION */}
            <div className="flex flex-col justify-between border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
              {/* HEADER */}
              <div>
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                      Milan Heritage
                    </p>

                    <p className="mt-2 text-sm text-stone-400">
                      Interactive cultural journey
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onFinish}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-200 transition hover:bg-white/10"
                  >
                    Skip
                  </button>
                </div>

                {/* CONTENT */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScreen.id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* ICON */}
                    <div
                      className={`mb-8 inline-flex rounded-3xl bg-gradient-to-br ${currentScreen.accent} p-5 shadow-xl`}
                    >
                      <currentScreen.icon className="h-8 w-8 text-white" />
                    </div>

                    {/* TEXT */}
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-stone-400">
                        {currentScreen.eyebrow}
                      </p>

                      <h1 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl">
                        {currentScreen.title}
                      </h1>

                      <p className="mt-4 text-lg text-emerald-200">
                        {currentScreen.subtitle}
                      </p>

                      <p className="mt-6 max-w-xl text-base leading-8 text-stone-300">
                        {currentScreen.description}
                      </p>
                    </div>

                    {/* FEATURES */}
                    <div className="mt-10 flex flex-wrap gap-3">
                      {currentScreen.highlights.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200"
                        >
                          <Check className="h-4 w-4 text-emerald-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* FOOTER */}
              <div className="mt-14">
                {/* PROGRESS */}
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-stone-400">
                      Step {page + 1} of {tutorialScreens.length}
                    </span>

                    <span className="text-sm font-medium text-emerald-300">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.35 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    />
                  </div>
                </div>

                {/* CONTROLS */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={page === 0}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>

                  {/* DOTS */}
                  <div className="flex items-center gap-2">
                    {tutorialScreens.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setPage(index)}
                        className={`transition-all duration-300 ${
                          page === index
                            ? "h-2.5 w-10 rounded-full bg-emerald-400"
                            : "h-2.5 w-2.5 rounded-full bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="group flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    {isLast ? "Start Journey" : "Continue"}

                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT VISUAL SECTION */}
            <div className="relative hidden overflow-hidden lg:flex">
              {/* GRADIENT BACKGROUND */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`absolute inset-0 bg-gradient-to-br ${currentScreen.accent}`}
                />
              </AnimatePresence>

              <div className="relative z-10 flex w-full flex-col justify-between p-10">
                {/* IMAGE SECTION */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScreen.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.45 }}
                    className="mx-auto flex w-full max-w-xl flex-col gap-6"
                  >
                    {/* MAIN IMAGE */}
                    <div className="relative overflow-hidden rounded-[36px] border border-white/20 bg-black/20 shadow-2xl backdrop-blur-xl">
                      <img
                        src={currentScreen.image}
                        alt={currentScreen.title}
                        className="h-[420px] w-full object-cover"
                      />
                    </div>

                    {/* MINI CARDS */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <Camera className="h-5 w-5 text-white/80" />

                          <div>
                            <p className="text-sm font-medium">
                              AR Camera
                            </p>

                            <p className="text-xs text-white/60">
                              Interactive overlays
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <Volume2 className="h-5 w-5 text-white/80" />

                          <div>
                            <p className="text-sm font-medium">
                              Audio Guide
                            </p>

                            <p className="text-xs text-white/60">
                              Spatial storytelling
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* BOTTOM INFO */}
                <div className="rounded-3xl border border-white/15 bg-black/20 p-5 backdrop-blur-md">
                  <p className="text-lg leading-9 text-white/80">
                    Your experience dynamically adapts based on your location,
                    completed challenges, and landmarks explored across Milan.
                    As you move through the city, the journey shifts to match
                    your progress, suggesting new discoveries, unlocking fresh
                    story layers, and celebrating the places you visit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
