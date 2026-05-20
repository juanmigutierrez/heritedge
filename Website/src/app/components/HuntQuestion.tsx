import { motion } from "motion/react";
import { Mic, Send, Sparkles } from "lucide-react";

export interface HuntQuestionProps {
  title: string;
  question: string;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  feedback?: string;
  success?: boolean;
  hint?: string;
  placeholder?: string;
  submitLabel?: string;
  onVoice?: () => void;
}

export function HuntQuestion({
  title,
  question,
  answer,
  onAnswerChange,
  onSubmit,
  loading,
  feedback,
  success,
  hint,
  placeholder = "Type your answer",
  submitLabel = "Submit",
  onVoice,
}: HuntQuestionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-border bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {title}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-foreground">{question}</h2>
        </div>
        <div className="rounded-3xl bg-emerald-50 px-3 py-2 text-emerald-700 text-sm font-semibold inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Hunt
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-sm text-stone-600">
            <span className="sr-only">Answer</span>
            <input
              type="text"
              value={answer}
              onChange={(event) => onAnswerChange(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </label>
          {hint ? <p className="mt-2 text-xs text-muted-foreground">Hint: {hint}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || answer.trim().length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{submitLabel}</span>
          </button>
          {onVoice ? (
            <button
              type="button"
              onClick={onVoice}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-stone-50"
            >
              <Mic className="h-4 w-4" /> Voice answer
            </button>
          ) : null}
        </div>

        {feedback ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
            {feedback}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
