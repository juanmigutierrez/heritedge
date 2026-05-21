import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface HuntQuestionProps {
  id: string;
  question: string;
  options: string[];
  correct: string;
  rewardPoints: number;
  onComplete: (isCorrect: boolean) => void;
}

export function HuntQuestion({
  id,
  question,
  options,
  correct,
  rewardPoints,
  onComplete,
}: HuntQuestionProps) {
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [shake, setShake] = useState(false);

  const matchedAnswer = useMemo(
    () => selected.trim().toLowerCase() === correct.trim().toLowerCase(),
    [correct, selected]
  );

  const handleSubmit = () => {
    if (!selected) return;
    const isCorrect = matchedAnswer;

    if (isCorrect) {
      setStatus("correct");
      navigator.vibrate?.(50);
      window.setTimeout(() => {
        onComplete(true);
        setStatus("idle");
        setSelected("");
      }, 700);
      return;
    }

    setStatus("wrong");
    setShake(true);
    navigator.vibrate?.(20);
    window.setTimeout(() => setShake(false), 300);
    window.setTimeout(() => setStatus("idle"), 700);
    onComplete(false);
  };

  return (
    <motion.section
      animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Challenge
            </p>
            <h2 className="text-xl font-semibold">{question}</h2>
          </div>
          <div className="rounded-3xl bg-accent/15 px-3 py-2 text-sm font-semibold text-accent-strong">
            +{rewardPoints} pts
          </div>
        </div>

        <div className="grid gap-3">
          {options.map((option) => {
            const isSelected = selected === option;
            return (
              <button
                type="button"
                key={option}
                onClick={() => setSelected(option)}
                className={`rounded-3xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-accent bg-accent/15 text-accent-strong"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected || status === "correct"}
            className="inline-flex items-center justify-center rounded-3xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted"
          >
            {status === "correct" ? "Great!" : "Submit Answer"}
          </button>
          <p className="text-sm text-muted-foreground">
            Choose the best answer and stamp your progress.
          </p>
        </div>
      </div>

      {status === "correct" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 rounded-3xl bg-success/15 p-4 text-success"
        >
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <p className="font-semibold">Correct!</p>
            <p className="text-sm text-muted-foreground">You earned {rewardPoints} points.</p>
          </div>
        </motion.div>
      )}

      {status === "wrong" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 rounded-3xl bg-destructive/10 p-4 text-destructive"
        >
          <XCircle className="h-6 w-6" />
          <div>
            <p className="font-semibold">Not quite.</p>
            <p className="text-sm text-destructive">
              Try again with the clue in mind. You can do it.
            </p>
          </div>
        </motion.div>
      )}

      {status === "correct" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center rounded-[36px] bg-accent/15 py-4 text-sm font-semibold text-accent-strong"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Stamp earned — move to the next chapter when you're ready.
        </motion.div>
      )}
    </motion.section>
  );
}
