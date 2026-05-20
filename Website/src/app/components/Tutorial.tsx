import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, CornerDownRight, Sparkles, Shield } from "lucide-react";

const STORAGE_KEY = "heritedge.tutorialSeen";

const slides = [
  {
    title: "Welcome to Heritage Edge",
    description:
      "A guided exploration of Piazza del Duomo that turns every stop into a story, a clue, and a collectible souvenir.",
    icon: <Sparkles className="h-8 w-8" />,
    accent: "Collect memories as you explore Milan's iconic square.",
  },
  {
    title: "Play the Treasure Hunt",
    description:
      "Solve location clues, answer questions, and capture historic moments with the app's AR-powered hunt tracker.",
    icon: <CornerDownRight className="h-8 w-8" />,
    accent: "Your progress is saved automatically, and badges unlock as you go.",
  },
  {
    title: "Keep your souvenir",
    description:
      "Unlock the final souvenir camera, choose a custom mask, and share a framed keepsake from your adventure.",
    icon: <Shield className="h-8 w-8" />,
    accent: "The whole experience is built to stay with you after your walk.",
  },
];

export function Tutorial() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      navigate("/");
    }
  }, [navigate]);

  const slide = slides[page];

  const finish = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 via-slate-900 to-slate-950 text-white px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">Welcome</p>
            <h1 className="mt-3 text-3xl font-semibold">Heritage onboarding</h1>
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-emerald-100 transition hover:bg-white/10"
          >
            Skip
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-200">
            {slide.icon}
          </div>
          <h2 className="mt-6 text-2xl font-semibold">{slide.title}</h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">{slide.description}</p>
          <p className="mt-4 rounded-2xl bg-emerald-50/10 px-4 py-3 text-sm text-emerald-100">
            {slide.accent}
          </p>
        </motion.div>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <span>{page + 1} of {slides.length}</span>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`h-2.5 w-8 rounded-full ${index === page ? "bg-emerald-300" : "bg-slate-700"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3 flex-col sm:flex-row">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (page === slides.length - 1) {
                finish();
              } else {
                setPage((current) => Math.min(slides.length - 1, current + 1));
              }
            }}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            {page === slides.length - 1 ? "Get started" : "Next"}
            <ArrowRight className="ml-2 inline-block h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
