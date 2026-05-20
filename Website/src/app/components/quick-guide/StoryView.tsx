import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ArrowLeft, Quote, Check, Sparkles } from "lucide-react";
import type { Scene, IllustrationId, TimelineFrame } from "./scenes";
import { Illustration } from "./illustrations";
import { TimelineSlider } from "../ui/TimelineSlider";

interface StoryViewProps {
  chapterTitle: string;
  chapterYears: string;
  chapterIndex: number;
  totalChapters: number;
  scenes: Scene[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onClose: () => void;
  onComplete: () => void;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
}

export function StoryView({
  chapterTitle,
  chapterYears,
  chapterIndex,
  totalChapters,
  scenes,
  initialIndex = 0,
  onIndexChange,
  onClose,
  onComplete,
  onAskLuca,
}: StoryViewProps) {
  const [index, setIndex] = useState(initialIndex);
  const scene = scenes[index];
  const isLast = index === scenes.length - 1;
  const isFirst = index === 0;

  // Reset to scene 0 whenever the underlying scenes array changes (chapter switch).
  useEffect(() => {
    setIndex(initialIndex);
  }, [scenes, initialIndex]);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  const next = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setIndex((i) => Math.min(i + 1, scenes.length - 1));
    }
  }, [isLast, scenes.length, onComplete]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`${chapterTitle} story`}
    >
      {/* Top: segmented progress bars */}
      <div className="px-4 pt-3 sm:px-6 sm:pt-4 flex gap-1.5">
        {scenes.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--secondary)" }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                background: "var(--accent)",
                width: i < index ? "100%" : i === index ? "100%" : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="px-5 sm:px-8 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-caption">
            Chapter {chapterIndex + 1} / {totalChapters}
          </p>
          <p className="text-xs text-muted-foreground -mt-0.5">
            {chapterTitle} · {chapterYears}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close story"
          className="w-9 h-9 rounded-full bg-secondary text-foreground hover:bg-muted flex items-center justify-center active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scene content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-6 sm:py-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-auto"
          >
            <SceneContent scene={scene} onAdvance={next} onAskLuca={onAskLuca} index={index} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="px-5 sm:px-8 pb-6 sm:pb-8 pt-2 flex items-center gap-3 border-t border-border bg-background">
        <button
          onClick={prev}
          disabled={isFirst}
          aria-label="Previous scene"
          className="h-11 px-4 rounded-xl border border-border text-foreground bg-card text-sm flex items-center gap-2 disabled:opacity-40 hover:bg-secondary active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {onAskLuca && scene?.askLucaPrompt && (
          <button
            onClick={() => onAskLuca(scene.askLucaPrompt, index)}
            className="hidden sm:inline-flex h-11 px-4 rounded-xl border border-border text-foreground bg-card text-sm items-center gap-2 hover:bg-secondary active:scale-[0.98] transition-all"
            aria-label="Ask Luca about this scene"
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-strong)" }} />
            Ask Luca
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={next}
          aria-label={isLast ? "Finish chapter" : "Next scene"}
          className="h-11 px-5 rounded-xl text-sm font-medium flex items-center gap-2 active:scale-[0.98] transition-all"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {isLast ? "Finish chapter" : "Next"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </nav>
    </motion.div>
  );
}

// ─── Scene dispatcher ─────────────────────────────────────────────────────────

function SceneContent({
  scene,
  onAdvance,
  onAskLuca,
  index,
}: {
  scene: Scene;
  onAdvance: () => void;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  switch (scene.kind) {
    case "hero":
      return <SceneHero title={scene.title} subtitle={scene.subtitle} image={scene.image} />;
    case "quote":
      return <SceneQuote text={scene.text} askLucaPrompt={scene.askLucaPrompt} onAskLuca={onAskLuca} index={index} />;
    case "narrative":
      return (
        <SceneNarrative
          eyebrow={scene.eyebrow}
          heading={scene.heading}
          body={scene.body}
          image={scene.image}
          askLucaPrompt={scene.askLucaPrompt}
          onAskLuca={onAskLuca}
          index={index}
        />
      );
    case "reveal":
      return (
        <SceneReveal
          question={scene.question}
          answer={scene.answer}
          askLucaPrompt={scene.askLucaPrompt}
          onAskLuca={onAskLuca}
          index={index}
        />
      );
    case "quiz":
      return (
        <SceneQuiz
          question={scene.question}
          options={scene.options}
          correctIndex={scene.correctIndex}
          explanation={scene.explanation}
          onAdvance={onAdvance}
        />
      );
    case "illustration":
      return (
        <SceneIllustration
          id={scene.id}
          eyebrow={scene.eyebrow}
          heading={scene.heading}
          caption={scene.caption}
        />
      );
    case "videoEmbed":
      return (
        <SceneVideo
          title={scene.title}
          src={scene.src}
          poster={scene.poster}
          caption={scene.caption}
          autoAdvance={scene.autoAdvance}
          onAdvance={onAdvance}
          askLucaPrompt={scene.askLucaPrompt}
          onAskLuca={onAskLuca}
          index={index}
        />
      );
    case "timelineSlider":
      return (
        <SceneTimelineSlider
          title={scene.title}
          frames={scene.frames}
          askLucaPrompt={scene.askLucaPrompt}
          onAskLuca={onAskLuca}
          index={index}
        />
      );
    case "cultural":
      return (
        <SceneCultural
          eyebrow={scene.eyebrow}
          heading={scene.heading}
          body={scene.body}
          image={scene.image}
          askLucaPrompt={scene.askLucaPrompt}
          onAskLuca={onAskLuca}
          index={index}
        />
      );
    case "closing":
      return (
        <SceneClosing
          heading={scene.heading}
          body={scene.body}
          cta={scene.cta}
          askLucaPrompt={scene.askLucaPrompt}
          onAskLuca={onAskLuca}
          index={index}
        />
      );
    default:
      return null;
  }
}

// ─── Scene renderers ──────────────────────────────────────────────────────────

function AskLucaInline({
  prompt,
  onAskLuca,
  index,
}: {
  prompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  if (!prompt || !onAskLuca) return null;
  return (
    <button
      onClick={() => onAskLuca(prompt, index)}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all active:scale-[0.98]"
      style={{
        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
        borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
        color: "var(--accent-strong)",
      }}
      aria-label="Ask Luca more"
    >
      <Sparkles className="w-3 h-3" />
      Ask Luca more →
    </button>
  );
}

function SceneHero({ title, subtitle, image }: { title: string; subtitle: string; image?: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
      {image && (
        <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(20,17,15,0.9) 0%, rgba(31,27,22,0.9) 65%, rgba(58,42,24,0.92) 100%)",
        }}
        aria-hidden
      />
      <div className="relative px-6 py-8">
        <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
          Chapter opener
        </p>
        <h2 className="font-display mt-2 text-foreground" style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", lineHeight: 1.05 }}>
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div
          className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent-strong)" }}
        >
          Begin chapter →
        </div>
      </div>
    </div>
  );
}

function SceneQuote({
  text,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  text: string;
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  return (
    <figure className="text-center">
      <Quote
        className="w-7 h-7 mx-auto mb-4 opacity-80"
        style={{ color: "var(--accent)" }}
        aria-hidden
      />
      <blockquote
        className="font-display italic text-foreground leading-snug"
        style={{ fontSize: "clamp(1.4rem, 4.5vw, 2rem)", letterSpacing: "-0.005em" }}
      >
        "{text}"
      </blockquote>
      <div className="mt-5 flex justify-center">
        <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
      </div>
    </figure>
  );
}

function SceneNarrative({
  eyebrow,
  heading,
  body,
  image,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  image?: string;
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
          {eyebrow}
        </p>
      )}
      <h2 className="h2 mt-2 text-foreground">{heading}</h2>
      {image && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-border bg-card">
          <img src={image} alt={heading} className="w-full h-auto" />
        </div>
      )}
      <p className="mt-4 text-base sm:text-[17px] text-foreground leading-relaxed">
        {body}
      </p>
      <div className="mt-5">
        <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
      </div>
    </div>
  );
}

function SceneReveal({
  question,
  answer,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  question: string;
  answer: string;
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        Did you know?
      </p>
      <h2 className="h2 mt-2 text-foreground">{question}</h2>

      <div className="mt-6">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-4 rounded-2xl border border-dashed text-sm font-medium hover:bg-secondary active:scale-[0.98] transition-all"
            style={{ borderColor: "var(--accent)", color: "var(--accent-strong)" }}
          >
            Tap to reveal
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl p-5"
            style={{
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              borderLeft: "3px solid var(--accent)",
            }}
          >
            <p className="text-base text-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </div>
      {revealed && (
        <div className="mt-4">
          <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
        </div>
      )}
    </div>
  );
}

function SceneQuiz({
  question,
  options,
  correctIndex,
  explanation,
  onAdvance,
}: {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  onAdvance: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const isCorrect = picked === correctIndex;

  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        Quick guess
      </p>
      <h2 className="h2 mt-2 text-foreground">{question}</h2>

      <div className="mt-6 space-y-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswered = picked !== null;
          const isThisCorrect = i === correctIndex;

          let style: React.CSSProperties = {
            background: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          };

          if (isAnswered) {
            if (isThisCorrect) {
              style = {
                background: "color-mix(in srgb, var(--success) 18%, transparent)",
                borderColor: "var(--success)",
                color: "var(--foreground)",
              };
            } else if (isPicked) {
              style = {
                background: "color-mix(in srgb, var(--destructive) 14%, transparent)",
                borderColor: "var(--destructive)",
                color: "var(--foreground)",
              };
            } else {
              style.opacity = 0.55;
            }
          }

          return (
            <button
              key={opt}
              onClick={() => picked === null && setPicked(i)}
              disabled={picked !== null}
              className="w-full py-3.5 px-4 rounded-2xl border text-left text-sm flex items-center justify-between transition-all active:scale-[0.99]"
              style={style}
            >
              <span>{opt}</span>
              {isAnswered && isThisCorrect && (
                <Check className="w-4 h-4" style={{ color: "var(--success)" }} />
              )}
              {isAnswered && isPicked && !isThisCorrect && (
                <X className="w-4 h-4" style={{ color: "var(--destructive)" }} />
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5"
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: isCorrect ? "var(--success)" : "var(--accent-strong)" }}
          >
            {isCorrect ? "Right on the money." : "Close - but the truth is even better."}
          </p>
          {explanation && (
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
          )}
          <button
            onClick={onAdvance}
            className="mt-5 w-full py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            Continue →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function SceneIllustration({
  id,
  eyebrow,
  heading,
  caption,
}: {
  id: IllustrationId;
  eyebrow?: string;
  heading?: string;
  caption?: string;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
          {eyebrow}
        </p>
      )}
      {heading && <h2 className="h2 mt-2 text-foreground">{heading}</h2>}

      <div className="mt-5">
        <Illustration id={id} />
      </div>

      {caption && (
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed text-center max-w-md mx-auto">
          {caption}
        </p>
      )}
    </div>
  );
}

function SceneVideo({
  title,
  src,
  poster,
  caption,
  autoAdvance,
  onAdvance,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  title: string;
  src?: string;
  poster?: string;
  caption?: string;
  autoAdvance?: boolean;
  onAdvance: () => void;
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  useEffect(() => {
    if (!autoAdvance) return;
    const el = document.getElementById("scene-video") as HTMLVideoElement | null;
    if (!el) return;
    const handleEnd = () => onAdvance();
    el.addEventListener("ended", handleEnd);
    return () => el.removeEventListener("ended", handleEnd);
  }, [autoAdvance, onAdvance]);

  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        Archival footage
      </p>
      <h2 className="h2 mt-2 text-foreground">{title}</h2>
      <div className="mt-4 rounded-2xl overflow-hidden border border-border bg-card">
        <video id="scene-video" src={src} poster={poster} className="w-full h-auto" controls />
      </div>
      {caption && (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {caption}
        </p>
      )}
      <div className="mt-4">
        <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
      </div>
    </div>
  );
}

function SceneTimelineSlider({
  title,
  frames,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  title: string;
  frames: TimelineFrame[];
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        Timeline slider
      </p>
      <h2 className="h2 mt-2 text-foreground">{title}</h2>
      <div className="mt-4">
        <TimelineSlider frames={frames} />
      </div>
      <div className="mt-4">
        <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
      </div>
    </div>
  );
}

function SceneCultural({
  eyebrow,
  heading,
  body,
  image,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  image?: string;
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
          {eyebrow}
        </p>
      )}
      <h2 className="h2 mt-2 text-foreground">{heading}</h2>
      {image && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-border bg-card">
          <img src={image} alt={heading} className="w-full h-auto" />
        </div>
      )}
      <p className="mt-4 text-base text-foreground leading-relaxed">{body}</p>
      <div className="mt-4">
        <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
      </div>
    </div>
  );
}

function SceneClosing({
  heading,
  body,
  cta,
  askLucaPrompt,
  onAskLuca,
  index,
}: {
  heading: string;
  body?: string;
  cta?: string;
  askLucaPrompt?: string;
  onAskLuca?: (prompt?: string, returnIndex?: number) => void;
  index: number;
}) {
  return (
    <div className="text-center">
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        End of chapter
      </p>
      <h2
        className="font-display mt-3 text-foreground"
        style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", lineHeight: 1.1, letterSpacing: "-0.015em" }}
      >
        {heading}
      </h2>
      {body && (
        <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          {body}
        </p>
      )}
      {cta && (
        <div
          className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
          style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent-strong)" }}
        >
          {cta}
        </div>
      )}
      <div className="mt-4 flex justify-center">
        <AskLucaInline prompt={askLucaPrompt} onAskLuca={onAskLuca} index={index} />
      </div>
    </div>
  );
}
