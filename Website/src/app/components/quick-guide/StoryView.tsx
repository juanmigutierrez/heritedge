import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, ArrowLeft, Quote, Check, Sparkles } from "lucide-react";
import type { Scene, IllustrationId } from "./scenes";
import { Illustration } from "./illustrations";
import { TimelineSlider } from "./TimelineSlider";


interface StoryViewProps {
  chapterTitle: string;
  chapterYears: string;
  chapterIndex: number;
  totalChapters: number;
  scenes: Scene[];
  onClose: () => void;
  onComplete: () => void;
  onAskLuca?: (question?: string) => void;
}

// Returns the contextual chat question for a scene, if it defines one.
function getSceneChatQuestion(scene: Scene): string | undefined {
  if (scene.kind === "quote" || scene.kind === "narrative" || scene.kind === "reveal") {
    return scene.chatQuestion;
  }
  return undefined;
}

export function StoryView({
  chapterTitle,
  chapterYears,
  chapterIndex,
  totalChapters,
  scenes,
  onClose,
  onComplete,
  onAskLuca,
}: StoryViewProps) {
  const [index, setIndex] = useState(0);
  const scene = scenes[index];
  const isLast = index === scenes.length - 1;
  const isFirst = index === 0;

  // Reset to scene 0 whenever the underlying scenes array changes (chapter switch).
  useEffect(() => {
    setIndex(0);
  }, [scenes]);

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

  // Empty chapter (e.g. Modern before Task 2 ships its scenes) — show a
  // friendly "coming soon" panel instead of crashing on scenes[0].
  if (scenes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 text-center"
        role="dialog"
        aria-modal="true"
        aria-label={`${chapterTitle} not yet available`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-secondary text-foreground hover:bg-muted flex items-center justify-center active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <p className="text-caption mb-3" style={{ color: "var(--accent-strong)" }}>
          Chapter {chapterIndex + 1} of {totalChapters}
        </p>
        <h2 className="h2 text-foreground mb-3">{chapterTitle} · Coming soon.</h2>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          The scenes for this chapter are still being written. Check back in the next build.
        </p>
      </motion.div>
    );
  }

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
            <SceneContent scene={scene} onAdvance={next} />
            {onAskLuca && getSceneChatQuestion(scene) && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => onAskLuca(getSceneChatQuestion(scene))}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium active:scale-[0.98] transition-all"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 14%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                    color: "var(--accent-strong)",
                  }}
                  aria-label="Ask Luca more about this scene"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask Luca more →
                </button>
              </div>
            )}
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

        <div className="flex-1" />

        <button
          onClick={next}
          aria-label={isLast ? "Finish chapter" : "Next scene"}
          className="h-11 px-5 rounded-xl text-sm font-medium flex items-center gap-2 active:scale-[0.98] transition-all"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          {scene.kind === "closing" && scene.ctaLabel
            ? scene.ctaLabel
            : isLast ? "Finish chapter" : "Next"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </nav>
    </motion.div>
  );
}

// ─── Scene dispatcher ─────────────────────────────────────────────────────────

function SceneContent({ scene, onAdvance }: { scene: Scene; onAdvance: () => void }) {
  switch (scene.kind) {
    case "hero":
      return <SceneHero subtitle={scene.subtitle} cta={scene.cta} onAdvance={onAdvance} />;
    case "quote":
      return <SceneQuote text={scene.text} />;
    case "narrative":
      return (
        <SceneNarrative
          eyebrow={scene.eyebrow}
          heading={scene.heading}
          body={scene.body}
          image={scene.image}
          imageAlt={scene.imageAlt}
          imageCaption={scene.imageCaption}
        />
      );
    case "reveal":
      return (
        <SceneReveal
          eyebrow={scene.eyebrow}
          question={scene.question}
          answerEyebrow={scene.answerEyebrow}
          answer={scene.answer}
          image={scene.image}
          imageAlt={scene.imageAlt}
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
    case "closing":
      return <SceneClosing heading={scene.heading} body={scene.body} />;
    case "cultural":
      return <SceneCultural eyebrow={scene.eyebrow} heading={scene.heading} body={scene.body} />;
    case "matchGame":
      return (
        <SceneMatchGame
          instruction={scene.instruction}
          pairs={scene.pairs}
          twist={scene.twist}
          reveal={scene.reveal}
          onAdvance={onAdvance}
        />
      );
    case "timelineSlider":
      return (
        <SceneTimelineSlider
          eyebrow={scene.eyebrow}
          heading={scene.heading}
          frames={scene.frames}
        />
      );
    default:
      return null;
  }
}

function SceneTimelineSlider({
  eyebrow,
  heading,
  frames,
}: {
  eyebrow?: string;
  heading: string;
  frames: Array<{ year: string; image: string; caption: string }>;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
          {eyebrow}
        </p>
      )}
      <h2 className="h2 mt-2 mb-5 text-foreground">{heading}</h2>
      <TimelineSlider frames={frames} />
    </div>
  );
}

// ─── Scene renderers ──────────────────────────────────────────────────────────

function SceneQuote({ text }: { text: string }) {
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
        “{text}”
      </blockquote>
    </figure>
  );
}

function SceneNarrative({
  eyebrow,
  heading,
  body,
  image,
  imageAlt,
  imageCaption,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
          {eyebrow}
        </p>
      )}
      <h2 className="h2 mt-2 text-foreground">{heading}</h2>

      {image ? (
        <div
          className="mt-5 rounded-2xl p-5 flex gap-4 items-start"
          style={{
            background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            borderLeft: "3px solid var(--accent)",
          }}
        >
          <img
            src={image}
            alt={imageAlt ?? ""}
            className="rounded-lg flex-shrink-0"
            style={{
              width: 110,
              height: 140,
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
              background: "#0a0a0a",
            }}
          />
          <p className="text-base text-foreground leading-relaxed italic flex-1">{body}</p>
        </div>
      ) : (
        <p className="mt-4 text-base sm:text-[17px] text-foreground leading-relaxed">
          {body}
        </p>
      )}

      {image && imageCaption && (
        <p className="mt-3 text-xs text-muted-foreground italic leading-snug">
          {imageCaption}
        </p>
      )}
    </div>
  );
}

function SceneReveal({
  eyebrow,
  question,
  answerEyebrow,
  answer,
  image,
  imageAlt,
}: {
  eyebrow?: string;
  question: string;
  answerEyebrow?: string;
  answer: string;
  image?: string;
  imageAlt?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        {eyebrow ?? "Did you know?"}
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
            {answerEyebrow && (
              <p
                className="text-caption mb-3"
                style={{ color: "var(--accent-strong)", letterSpacing: "0.08em" }}
              >
                {answerEyebrow}
              </p>
            )}
            {image ? (
              <div className="flex gap-4 items-start">
                <img
                  src={image}
                  alt={imageAlt ?? ""}
                  className="rounded-lg flex-shrink-0"
                  style={{
                    width: 110,
                    height: 140,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <p className="text-sm text-foreground leading-relaxed flex-1">
                  {answer}
                </p>
              </div>
            ) : (
              <p className="text-base text-foreground leading-relaxed">{answer}</p>
            )}
          </motion.div>
        )}
      </div>
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
            {isCorrect ? "Right on the money." : "Close — but the truth is even better."}
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

function SceneClosing({ heading, body }: { heading: string; body?: string }) {
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
    </div>
  );
}

function SceneHero({
  subtitle,
  cta = "Begin chapter →",
  onAdvance,
}: {
  subtitle: string;
  cta?: string;
  onAdvance: () => void;
}) {
  return (
    <div className="text-center flex flex-col items-center gap-6">
      {/* Gold dot grid */}
      <div
        aria-hidden
        style={{
          width: 120, height: 120,
          backgroundImage: "radial-gradient(circle, var(--accent) 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
          opacity: 0.35,
        }}
      />
      <p
        className="font-display text-foreground"
        style={{ fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)", letterSpacing: "0.01em" }}
      >
        {subtitle}
      </p>
      <button
        onClick={onAdvance}
        className="mt-2 px-7 py-3.5 rounded-2xl text-sm font-semibold active:scale-[0.97] transition-transform"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        {cta}
      </button>
    </div>
  );
}

function SceneCultural({
  eyebrow,
  heading,
  body,
}: {
  eyebrow: string;
  heading: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        {eyebrow}
      </p>
      <h2 className="h2 mt-2 text-foreground">{heading}</h2>
      <div
        className="mt-5 rounded-2xl p-5"
        style={{
          background: "color-mix(in srgb, var(--accent) 8%, transparent)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <p className="text-base text-foreground leading-relaxed italic">{body}</p>
      </div>
    </div>
  );
}

function SceneMatchGame({
  instruction,
  pairs,
  twist,
  reveal,
  onAdvance,
}: {
  instruction: string;
  pairs: Array<{ left: string; right: string }>;
  twist?: string;
  reveal: string;
  onAdvance: () => void;
}) {
  // Bottom-row slots: unique architects only — Piermarini receives two lines.
  // Memoized so it's stable across renders (used in a useEffect dep array).
  const slots = useMemo<string[]>(
    () => Array.from(new Set(pairs.map((p) => p.right))),
    [pairs]
  );

  const [connections, setConnections] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<{ from: string; x: number; y: number } | null>(null);
  const [bumped, setBumped] = useState<string | null>(null);
  // Bump tick forces re-render so SVG line endpoints recompute when layout settles.
  const [bumpTick, setBumpTick] = useState(0);

  const containerRef  = useRef<HTMLDivElement>(null);
  const buildingRefs  = useRef<Record<string, HTMLDivElement | null>>({});
  const slotRefs      = useRef<Record<string, HTMLDivElement | null>>({});
  const bumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the wrong-slot shake timeout on unmount so we don't setState late.
  useEffect(() => () => {
    if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
  }, []);

  const allConnected = pairs.every((p) => connections[p.left] === p.right);

  // Recompute SVG endpoints on window resize while interactive.
  useEffect(() => {
    const onResize = () => setBumpTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pointInContainer = (clientX: number, clientY: number) => {
    const cr = containerRef.current?.getBoundingClientRect();
    if (!cr) return { x: 0, y: 0 };
    return { x: clientX - cr.left, y: clientY - cr.top };
  };

  const center = (el: HTMLElement | null, anchor: "top" | "bottom") => {
    if (!el || !containerRef.current) return null;
    const er = el.getBoundingClientRect();
    const cr = containerRef.current.getBoundingClientRect();
    return {
      x: er.left - cr.left + er.width / 2,
      y: anchor === "top" ? er.top - cr.top : er.bottom - cr.top,
    };
  };

  const startDrag = (building: string, clientX: number, clientY: number) => {
    if (connections[building]) return;
    const p = pointInContainer(clientX, clientY);
    setDrag({ from: building, x: p.x, y: p.y });
  };

  // Document-level pointer handling while a drag is active.
  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const p = pointInContainer(e.clientX, e.clientY);
      setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : null));
    };

    const onUp = (e: PointerEvent) => {
      const tgt = document.elementFromPoint(e.clientX, e.clientY);
      let hit: string | null = null;
      for (const arch of slots) {
        const el = slotRefs.current[arch];
        if (el && (el === tgt || el.contains(tgt as Node))) { hit = arch; break; }
      }
      if (hit) {
        const correct = pairs.find((p) => p.left === drag.from)?.right;
        if (hit === correct) {
          setConnections((c) => ({ ...c, [drag.from]: hit! }));
        } else {
          setBumped(hit);
          if (bumpTimeoutRef.current) clearTimeout(bumpTimeoutRef.current);
          bumpTimeoutRef.current = setTimeout(() => setBumped(null), 400);
        }
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, pairs, slots]);

  // Force one extra recompute pass after first paint so refs are populated.
  useEffect(() => { setBumpTick((t) => t + 1); }, []);
  void bumpTick;

  return (
    <div>
      <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
        Mini-game
      </p>
      <h2 className="h2 mt-2 text-foreground">{instruction}</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Drag from a building down to its architect.
      </p>

      <div
        ref={containerRef}
        className="mt-6"
        style={{ position: "relative", userSelect: "none", touchAction: "none" }}
      >
        {/* Buildings row */}
        <div className="flex gap-2">
          {pairs.map((p) => {
            const connected = connections[p.left] !== undefined;
            return (
              <div
                key={p.left}
                ref={(el) => { buildingRefs.current[p.left] = el; }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startDrag(p.left, e.clientX, e.clientY);
                }}
                className="flex-1 min-w-0 py-3 px-2 rounded-xl border text-xs font-medium text-center"
                style={{
                  borderColor: connected ? "var(--accent)" : "var(--border)",
                  background: connected
                    ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                    : "var(--card)",
                  color: "var(--foreground)",
                  cursor: connected ? "default" : "grab",
                  touchAction: "none",
                }}
              >
                {p.left}
              </div>
            );
          })}
        </div>

        {/* Spacer for SVG lines */}
        <div style={{ height: 64 }} />

        {/* Architects row */}
        <div className="flex gap-2">
          {slots.map((arch) => {
            const incoming = Object.values(connections).filter((a) => a === arch).length;
            const filled = incoming > 0;
            const isMistake = bumped === arch;
            return (
              <div
                key={arch}
                ref={(el) => { slotRefs.current[arch] = el; }}
                className="flex-1 min-w-0 py-3 px-2 rounded-xl border text-xs font-medium text-center transition-all"
                style={{
                  borderColor: isMistake
                    ? "var(--destructive)"
                    : filled
                    ? "var(--accent)"
                    : "var(--border)",
                  background: isMistake
                    ? "color-mix(in srgb, var(--destructive) 14%, transparent)"
                    : filled
                    ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                    : "var(--card)",
                  color: "var(--foreground)",
                  animation: isMistake ? "matchShake 0.35s ease" : undefined,
                }}
              >
                {arch}
              </div>
            );
          })}
        </div>

        {/* SVG line overlay */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {/* Completed lines */}
          {Object.entries(connections).map(([building, arch]) => {
            const from = center(buildingRefs.current[building], "bottom");
            const to   = center(slotRefs.current[arch], "top");
            if (!from || !to) return null;
            return (
              <line
                key={building}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round"
              />
            );
          })}
          {/* Active drag line */}
          {drag && (() => {
            const from = center(buildingRefs.current[drag.from], "bottom");
            if (!from) return null;
            return (
              <line
                x1={from.x} y1={from.y} x2={drag.x} y2={drag.y}
                stroke="var(--accent-strong)" strokeWidth={2}
                strokeDasharray="5 4" strokeLinecap="round"
              />
            );
          })()}
        </svg>

        <style>{`
          @keyframes matchShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
        `}</style>
      </div>

      {allConnected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          {twist && (
            <p className="text-sm font-medium mb-2" style={{ color: "var(--accent-strong)" }}>
              {twist}
            </p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{reveal}</p>
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
