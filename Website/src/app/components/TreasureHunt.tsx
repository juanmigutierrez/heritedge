import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Camera,
  Check,
  Lightbulb,
  Loader2,
  MapPin,
  Mic,
  RotateCcw,
  Trophy,
  X,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  Compass
} from "lucide-react";
import { useHuntState } from "./HuntStateProvider";
import huntData from "@/content/treasure-hunt.json";
import knowledgeBase from "@/content/knowledge-base.json";
import {
  getHint,
  gradeAnswer,
  verifyPhoto,
  type Verdict,
} from "@/services/huntService";

interface ChallengeFeedback {
  correct: string;
  incorrect: string;
}

interface HuntChallenge {
  id: string;
  landmark: string;
  title: string;
  description: string;
  type: "photo" | "question";
  photoPrompt?: string;
  question?: string;
  expectedAnswer?: string;
  acceptedAnswers?: string[];
  feedback: ChallengeFeedback;
  arHint?: string;
  markerImage?: string;
  location: string;
  period?: string;
  relatedFactIds?: string[];
  points: number;
}

interface RecapState {
  outcome: "correct" | "incorrect" | "low-confidence";
  message: string;
  reason?: string;
  source?: { label: string; url?: string };
  pointsEarned: number;
  correctAnswer?: string;
}

const challenges = huntData.challenges as HuntChallenge[];
const facts = knowledgeBase.facts as Array<{
  id: string;
  body: string;
  source?: { label: string; url?: string };
}>;

function factById(id: string | undefined) {
  if (!id) return undefined;
  return facts.find((fact) => fact.id === id);
}

function primaryFactBody(challenge: HuntChallenge): string {
  return (challenge.relatedFactIds ?? [])
    .map((id) => factById(id)?.body)
    .filter(Boolean)
    .join(" ");
}

function primarySource(challenge: HuntChallenge) {
  const firstId = challenge.relatedFactIds?.[0];
  return factById(firstId)?.source;
}

function badgeForChallenge(challenge: HuntChallenge) {
  if (challenge.type === "photo") return "Field Photographer";
  if (challenge.landmark === "duomo") return "Duomo Defender";
  if (challenge.landmark === "galleria") return "Galleria Guide";
  if (challenge.landmark === "palazzo") return "Palazzo Patron";
  return "Quiz Solver";
}

export function TreasureHunt() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, completeChallenge, startHunt, pauseHunt } = useHuntState();
  const completedCount = challenges.filter((challenge) =>
    state.completedChallenges.includes(challenge.id)
  ).length;
  const routeIndex = location.state?.currentIndex;
  const nextAvailableIndex = Math.min(completedCount, challenges.length - 1);

  const [currentIndex, setCurrentIndex] = useState(() =>
    typeof routeIndex === "number" && routeIndex >= 0 && routeIndex < challenges.length
      ? routeIndex
      : nextAvailableIndex
  );
  const [attemptCount, setAttemptCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [recap, setRecap] = useState<RecapState | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const current = challenges[currentIndex];
  const isCompleted = state.completedChallenges.includes(current.id);
  const progressPct = Math.round((completedCount / challenges.length) * 100);

  useEffect(() => {
    startHunt();
    return () => pauseHunt();
  }, []);

  useEffect(() => {
    if (typeof routeIndex === "number" && routeIndex >= 0 && routeIndex < challenges.length) {
      setCurrentIndex(routeIndex);
      resetAttempt();
    }
  }, [routeIndex]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const photoSubject = useMemo(() => {
    return [current.photoPrompt, primaryFactBody(current)].filter(Boolean).join(" - ");
  }, [current]);

  function resetAttempt() {
    setAttemptCount(0);
    setSubmitting(false);
    setRecap(null);
    setPhotoFile(null);
    setPhotoPreview((preview) => {
      if (preview) URL.revokeObjectURL(preview);
      return null;
    });
    setTextAnswer("");
    setHint(null);
    setVoiceListening(false);
  }

  function completeCurrent(points: number) {
    completeChallenge(
      current.id,
      points,
      current.landmark,
      points > 0 ? badgeForChallenge(current) : undefined
    );
  }

  function moveNext() {
    resetAttempt();
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    navigate("/summary", { state: { completedQuiz: true } });
  }

  function submitIncorrectAndNext() {
    if (!isCompleted) {
      completeCurrent(0);
    }
    moveNext();
  }

  const onPhotoPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview((preview) => {
      if (preview) URL.revokeObjectURL(preview);
      return URL.createObjectURL(file);
    });
    setRecap(null);
  };

  function retakePhoto() {
    setPhotoFile(null);
    setPhotoPreview((preview) => {
      if (preview) URL.revokeObjectURL(preview);
      return null;
    });
    setRecap(null);
  }

  async function submitPhoto() {
    if (!photoFile) return;
    setSubmitting(true);
    setAttemptCount((count) => count + 1);
    try {
      const result = await verifyPhoto(photoFile, photoSubject, photoFile.name);
      handleVerdict(result.verdict, result.reason);
    } catch (error) {
      handleNetworkError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAnswer() {
    if (!textAnswer.trim() || !current.question || !current.expectedAnswer) return;
    setSubmitting(true);
    setAttemptCount((count) => count + 1);
    try {
      const result = await gradeAnswer(
        {
          question: current.question,
          expectedAnswer: current.expectedAnswer,
          acceptedAnswers: current.acceptedAnswers ?? [],
          factBody: primaryFactBody(current),
        },
        textAnswer.trim()
      );
      if (result.correct) {
        awardSuccess(current.points);
      } else {
        showIncorrect(result.reason);
      }
    } catch (error) {
      handleNetworkError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function startVoiceCapture() {
    const browserWindow = window as unknown as {
      webkitSpeechRecognition?: any;
      SpeechRecognition?: any;
    };
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      alert("Voice input is not available in your browser. Please type your answer.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setTextAnswer(transcript);
    };
    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  }

  function handleVerdict(verdict: Verdict, reason: string) {
    if (verdict === "match") {
      awardSuccess(current.points);
      return;
    }
    if (verdict === "low-confidence") {
      setRecap({
        outcome: "low-confidence",
        message:
          "We can't tell for sure if this is the right spot. You can submit it anyway for fewer points, or retake the photo.",
        reason,
        pointsEarned: 0,
      });
      return;
    }
    showIncorrect(reason);
  }

  function acceptLowConfidenceAnyway() {
    awardSuccess(Math.round(current.points * 0.6));
  }

  function awardSuccess(points: number) {
    if (!isCompleted) {
      completeCurrent(points);
    }
    setRecap({
      outcome: "correct",
      message: current.feedback.correct,
      source: primarySource(current),
      pointsEarned: points,
    });
  }

  function showIncorrect(reason?: string) {
    setRecap({
      outcome: "incorrect",
      message: current.feedback.incorrect,
      reason,
      source: primarySource(current),
      pointsEarned: 0,
      correctAnswer: current.expectedAnswer,
    });
  }

  function handleNetworkError(error: unknown) {
    console.error("[TreasureHunt] network error:", error);
    setRecap({
      outcome: "incorrect",
      message:
        "Something went wrong while checking your answer. Please check your internet connection and try again.",
      pointsEarned: 0,
    });
  }

  async function requestHint() {
    setHintLoading(true);
    try {
      const prompt = current.photoPrompt ?? current.question ?? current.description;
      const result = await getHint({
        title: current.title,
        prompt,
        factBody: primaryFactBody(current),
        attemptCount: Math.max(1, attemptCount + 1),
        type: current.type,
      });
      setHint(result.hint);
    } catch {
      setHint("Look around closely! Is there a small detail or sign nearby that matches the description?");
    } finally {
      setHintLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans antialiased selection:bg-accent/30 selection:text-accent-strong">
      {/* Header Area spanning 75% width container */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/90 px-6 pt-12 pb-4 shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl w-full items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent active:scale-95"
              aria-label="Exit current challenge"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                <h1 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Current Challenge</h1>
              </div>
              <p className="text-sm font-medium text-foreground">
                Stop {currentIndex + 1} <span className="text-muted-foreground">of {challenges.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-bold text-accent-strong shadow-sm backdrop-blur-md">
            <Trophy className="h-4 w-4 animate-bounce" />
            <motion.span key={state.score} initial={{ scale: 1.3, color: "#9C7A1F" }} animate={{ scale: 1, color: "#9C7A1F" }}>
              {state.score}
            </motion.span>
          </div>
        </div>

        {/* Challenge Progress Rail with expanded max-w width */}
        <div className="mx-auto mt-4 max-w-5xl w-full px-1">
          <div className="relative h-2 w-full rounded-full bg-secondary">
            <motion.div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-accent shadow-[0_0_12px_rgba(229,185,72,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {challenges.map((_, idx) => (
              <div
                key={idx}
                className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 transition-all duration-300 ${
                  idx <= completedCount
                    ? "border-accent bg-card"
                    : "border-border bg-secondary"
                }`}
                style={{ left: `${(idx / (challenges.length - 1)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Container Area - Adjusted to max-w-5xl for an open, wide look */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-5xl w-full">
          <AnimatePresence mode="wait">
            {recap && recap.outcome !== "low-confidence" ? (
              <RecapCard
                key="recap"
                recap={recap}
                isLast={currentIndex === challenges.length - 1}
                onNext={moveNext}
                onSkip={submitIncorrectAndNext}
                onRetry={() => setRecap(null)}
              />
            ) : (
              <motion.div
                key={`challenge-${current.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >
                {/* Challenge Information Card */}
                <div className={`relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xl ${
                  current.type === "photo" 
                    ? "" 
                    : ""
                }`}>
                  <div className="mb-4 flex items-start gap-4">
                    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-md border ${
                      current.type === "photo" 
                        ? "bg-accent/15 border-accent/20 text-accent-strong" 
                        : "bg-accent/15 border-accent/20 text-accent-strong"
                    }`}>
                      {current.type === "photo" ? <Camera className="h-7 w-7" /> : <HelpCircle className="h-7 w-7" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        {current.period || "History & Heritage"}
                      </span>
                      <h2 className="text-2xl font-black tracking-tight text-foreground mt-0.5">{current.title}</h2>
                      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{current.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm">
                      <MapPin className="h-4 w-4 text-accent-strong" />
                      <span className="font-semibold text-foreground">{current.location}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 font-bold text-accent-strong bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-md text-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>+{current.points} Points</span>
                    </div>
                  </div>
                </div>

                {isCompleted && (
                  <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-5 text-base text-success shadow-sm backdrop-blur-md">
                    <Check className="h-5 w-5 flex-shrink-0 text-success" />
                    <span>You already answered this challenge correctly! Feel free to read through the info or tap below to continue.</span>
                  </div>
                )}

                {/* Challenge Type Dispatcher */}
                {current.type === "photo" && (
                  <>
                    <PhotoChallenge
                      prompt={current.photoPrompt ?? ""}
                      preview={photoPreview}
                      submitting={submitting}
                      recapLowConfidence={recap}
                      onPick={() => fileInputRef.current?.click()}
                      onRetake={retakePhoto}
                      onSubmit={submitPhoto}
                      onAcceptAnyway={acceptLowConfidenceAnyway}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={onPhotoPicked}
                      className="hidden"
                    />
                  </>
                )}

                {current.type === "question" && (
                  <QuestionChallenge
                    question={current.question ?? ""}
                    answer={textAnswer}
                    setAnswer={setTextAnswer}
                    submitting={submitting}
                    voiceListening={voiceListening}
                    onVoice={startVoiceCapture}
                    onSubmit={submitAnswer}
                  />
                )}

                {/* Updated Simplified Hint System Block */}
                <HintBlock
                  attemptCount={attemptCount}
                  loading={hintLoading}
                  hint={hint}
                  onRequest={requestHint}
                />

                {/* Navigation Bottom Panel */}
                <div className="rounded-[2rem] border border-border bg-card/60 p-8 text-center shadow-md backdrop-blur-md">
                  <div className="flex items-center justify-center gap-2 text-base text-muted-foreground">
                    <Compass className="h-5 w-5 text-muted-foreground" />
                    <p>You have finished {completedCount} out of {challenges.length} stops</p>
                  </div>
                  <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => navigate("/hunt")}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent active:scale-95 sm:w-auto"
                    >
                      View Map Tracker
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/summary")}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-muted px-8 py-4 text-base font-bold text-foreground transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-accent active:scale-95 sm:w-auto"
                    >
                      Go to Summary
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PhotoChallenge(props: {
  prompt: string;
  preview: string | null;
  submitting: boolean;
  recapLowConfidence: RecapState | null;
  onPick: () => void;
  onRetake: () => void;
  onSubmit: () => void;
  onAcceptAnyway: () => void;
}) {
  const {
    prompt,
    preview,
    submitting,
    recapLowConfidence,
    onPick,
    onRetake,
    onSubmit,
    onAcceptAnyway,
  } = props;
  const isLowConfidence = recapLowConfidence?.outcome === "low-confidence";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-accent/10 p-5 text-foreground shadow-sm">
        <div className="flex gap-2.5">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-accent-strong mt-0.5" />
          <p className="text-base font-medium leading-relaxed">{prompt}</p>
        </div>
      </div>

      {preview ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-xl group">
          <img src={preview} alt="Your captured photo" className="h-full w-full object-cover" />
          
          <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/60" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/60" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/60" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/60" />
          </div>

          {!submitting && !isLowConfidence && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
              <button
                type="button"
                onClick={onRetake}
                className="w-full max-w-sm mx-auto block rounded-xl bg-white/10 border border-white/20 py-3 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                Retake Photo
              </button>
            </div>
          )}
          {submitting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white backdrop-blur-sm">
              <Loader2 className="h-9 w-9 animate-spin text-accent" />
              <span className="text-base font-bold text-white animate-pulse">Checking your photo...</span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className="relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-muted/50 transition hover:bg-muted hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent active:scale-[0.99] group"
        >
          <div className="absolute inset-6 border border-transparent group-hover:border-border rounded-2xl pointer-events-none transition-colors" />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/15 shadow-md text-accent-strong transition-transform group-hover:scale-110">
            <Camera className="h-9 w-9" />
          </div>
          <div className="px-6 text-center">
            <p className="text-lg font-black text-foreground">Take Photo</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap here to open your camera and scan the location</p>
          </div>
        </button>
      )}

      {isLowConfidence && (
        <div className="space-y-4 rounded-2xl border border-accent/30 bg-accent/10 p-6 shadow-md backdrop-blur-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-accent-strong mt-0.5" />
            <div>
              <p className="text-base font-bold text-foreground">Not quite sure</p>
              <p className="mt-1 text-base text-muted-foreground leading-relaxed">{recapLowConfidence?.message}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onRetake}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent/30 bg-muted py-3.5 text-base font-bold text-accent-strong transition hover:bg-secondary active:scale-[0.98]"
            >
              <RotateCcw className="h-5 w-5" />
              Retake Photo
            </button>
            <button
              type="button"
              onClick={onAcceptAnyway}
              className="flex-1 rounded-xl bg-accent py-3.5 text-base font-bold text-accent-foreground shadow-md transition hover:opacity-90 active:scale-[0.98]"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      )}

      {preview && !isLowConfidence && !submitting && (
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-2xl bg-accent py-4 text-base font-bold text-accent-foreground shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98]"
        >
          Submit Photo
        </button>
      )}
    </div>
  );
}

function QuestionChallenge(props: {
  question: string;
  answer: string;
  setAnswer: (value: string) => void;
  submitting: boolean;
  voiceListening: boolean;
  onVoice: () => void;
  onSubmit: () => void;
}) {
  const { question, answer, setAnswer, submitting, voiceListening, onVoice, onSubmit } = props;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-accent/10 p-5 text-foreground shadow-sm">
        <p className="text-base font-medium leading-relaxed">{question}</p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-sm focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/40 transition">
        <input
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Type your answer here..."
          className="flex-1 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && answer.trim() && !submitting) onSubmit();
          }}
        />
        <button
          type="button"
          onClick={onVoice}
          disabled={voiceListening}
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
            voiceListening
              ? "bg-destructive text-destructive-foreground animate-pulse shadow-[0_0_12px_rgba(178,58,58,0.4)]"
              : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
          title={voiceListening ? "Listening..." : "Tap to speak your answer"}
        >
          <Mic className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!answer.trim() || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-bold text-accent-foreground shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-accent-foreground" />
            Checking your answer...
          </>
        ) : (
          "Submit Answer"
        )}
      </button>
    </div>
  );
}

function HintBlock(props: {
  attemptCount: number;
  loading: boolean;
  hint: string | null;
  onRequest: () => void;
}) {
  const { attemptCount, loading, hint, onRequest } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${
      hint 
        ? "border-accent/30 bg-accent/5 shadow-sm" 
        : "border-border bg-card/50"
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
            hint ? "bg-accent/15 border-accent/20 text-accent-strong" : "bg-muted border-border text-muted-foreground"
          }`}>
            <Lightbulb className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-foreground">Need a Hint?</h4>
            
            {hint ? (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="mt-2 text-base leading-relaxed text-foreground font-medium"
              >
                {hint}
              </motion.p>
            ) : (
              <div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stuck on this challenge? Get a helpful clue about this location.
                </p>
                {expanded && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    Note: Hints help point you toward interesting historical clues or design details nearby without giving away the exact answer.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={onRequest}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-muted border border-border px-5 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                    Finding hint...
                  </>
                ) : (
                  <>Get Hint {attemptCount > 0 ? `(Attempt ${attemptCount + 1})` : ""}</>
                )}
              </button>
              
              {!hint && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {expanded ? "Hide Details" : "How hints work"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecapCard(props: {
  recap: RecapState;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
  onRetry: () => void;
}) {
  const { recap, isLast, onNext, onSkip, onRetry } = props;
  const isCorrect = recap.outcome === "correct" || recap.outcome === "low-confidence";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl border border-border bg-card p-8 shadow-2xl text-center relative overflow-hidden"
    >
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20 ${
        isCorrect ? "bg-success" : "bg-destructive"
      }`} />

      <motion.div
        initial={{ scale: 0.4, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 160, damping: 12 }}
        className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-md ${
          isCorrect 
            ? "bg-success/10 border-success/30 text-success" 
            : "bg-destructive/10 border-destructive/30 text-destructive"
        }`}
      >
        {isCorrect ? <Check className="h-11 w-11" /> : <X className="h-11 w-11" />}
      </motion.div>

      <h2 className="text-3xl font-black tracking-tight text-foreground">
        {isCorrect ? "Correct! Well Done!" : "Not Quite Right"}
      </h2>

      {isCorrect && recap.pointsEarned > 0 && (
        <motion.div 
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-2 inline-flex items-center gap-1 rounded-md bg-success/10 border border-success/30 px-3 py-1 text-sm font-black text-success"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>+{recap.pointsEarned} POINTS EARNED</span>
        </motion.div>
      )}

      <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">{recap.message}</p>

      {!isCorrect && recap.correctAnswer && (
        <div className="mt-5 max-w-md mx-auto text-left rounded-xl border border-destructive/20 bg-destructive/10 p-4 shadow-inner">
          <p className="text-xs font-bold uppercase tracking-wider text-destructive">The Correct Answer</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{recap.correctAnswer}</p>
        </div>
      )}

      {recap.reason && !isCorrect && (
        <p className="mt-3 text-sm font-medium text-muted-foreground bg-muted border border-border rounded-lg p-2 max-w-2xl mx-auto">
          Tip: {recap.reason}
        </p>
      )}

      {recap.source && (
        <a
          href={recap.source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-accent-strong hover:opacity-80 transition-colors group mx-auto"
        >
          <span>Learn more about this site: {recap.source.label}</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}

      <div className="mt-8 flex w-full flex-col gap-3 max-w-xs mx-auto">
        {isCorrect ? (
          <button
            type="button"
            onClick={onNext}
            className="w-full rounded-xl bg-accent py-4 text-base font-bold text-accent-foreground shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent active:scale-95"
          >
            {isLast ? "See Final Score" : "Next Challenge"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-md transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full rounded-xl border border-border bg-muted py-3 text-xs font-bold text-muted-foreground transition hover:bg-secondary active:scale-95"
            >
              Skip this stop (0 points)
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
