import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";
import huntData from "@/content/treasure-hunt.json";
import knowledgeBase from "@/content/knowledge-base.json";
import {
  verifyPhoto,
  gradeAnswer,
  getHint,
  type Verdict,
} from "@/services/huntService";

interface ChallengeFeedback {
  correct: string;
  incorrect: string;
}

interface RawChallenge {
  id: number;
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
}

const challenges: RawChallenge[] = huntData.challenges as RawChallenge[];
const facts = knowledgeBase.facts as Array<{
  id: string;
  body: string;
  source?: { label: string; url?: string };
}>;

function factById(id: string | undefined) {
  if (!id) return undefined;
  return facts.find((f) => f.id === id);
}

function primaryFactBody(challenge: RawChallenge): string {
  const ids = challenge.relatedFactIds ?? [];
  return ids
    .map((id) => factById(id)?.body)
    .filter(Boolean)
    .join(" ");
}

function primarySource(challenge: RawChallenge) {
  const firstId = challenge.relatedFactIds?.[0];
  return factById(firstId)?.source;
}

export function TreasureHunt() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  // Per-attempt state — reset when we move to the next challenge
  const [attemptCount, setAttemptCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [recap, setRecap] = useState<RecapState | null>(null);

  // PHOTO-specific
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // QUESTION-specific
  const [textAnswer, setTextAnswer] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);

  // HINT
  const [hintLoading, setHintLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const current = challenges[currentIndex];
  const progressPct = (completedIds.length / challenges.length) * 100;

  const photoSubject = useMemo(() => {
    // Build a "subject string" for the vision model from the user-facing prompt
    // plus any related fact for context. Keeps the verifier grounded.
    const fact = primaryFactBody(current);
    return [current.photoPrompt, fact].filter(Boolean).join(" — ");
  }, [current]);

  function resetForNext() {
    setAttemptCount(0);
    setSubmitting(false);
    setRecap(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setTextAnswer("");
    setHint(null);
    setVoiceListening(false);
  }

  function goToNext() {
    resetForNext();
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      navigate("/summary", {
        state: {
          score: totalScore,
          totalChallenges: challenges.length,
          completed: completedIds.length,
          treasureHunt: true,
        },
      });
    }
  }

  // ── PHOTO ────────────────────────────────────────────────────────────────
  function onPhotoPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRecap(null);
  }

  function retakePhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setRecap(null);
  }

  async function submitPhoto() {
    if (!photoFile) return;
    setSubmitting(true);
    setAttemptCount((n) => n + 1);
    try {
      const result = await verifyPhoto(photoFile, photoSubject, photoFile.name);
      handleVerdict(result.verdict, result.reason);
    } catch (err) {
      handleNetworkError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function acceptLowConfidenceAnyway() {
    // User said "submit anyway" on a low-confidence verdict.
    awardSuccess("low-confidence");
  }

  // ── QUESTION ─────────────────────────────────────────────────────────────
  async function submitAnswer() {
    if (!textAnswer.trim() || !current.question || !current.expectedAnswer) return;
    setSubmitting(true);
    setAttemptCount((n) => n + 1);
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
        awardSuccess("correct");
      } else {
        showIncorrect(result.reason);
      }
    } catch (err) {
      handleNetworkError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function startVoiceCapture() {
    // Browser Web Speech API. Falls back silently if unsupported.
    const w = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("Voice input isn't available in this browser. Please type your answer.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      setTextAnswer(transcript);
    };
    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  }

  // ── VERDICT HANDLERS ─────────────────────────────────────────────────────
  function handleVerdict(v: Verdict, reason: string) {
    if (v === "match") return awardSuccess("correct");
    if (v === "low-confidence") {
      setRecap({
        outcome: "low-confidence",
        message:
          "We're not 100% sure this is the right subject. You can submit it anyway, or retake the photo.",
        reason,
        pointsEarned: 0,
      });
      return;
    }
    showIncorrect(reason);
  }

  function awardSuccess(kind: "correct" | "low-confidence") {
    const earned =
      kind === "low-confidence"
        ? Math.round(current.points * 0.6) // soft credit when we weren't sure
        : current.points;
    setTotalScore((s) => s + earned);
    setCompletedIds((ids) => [...ids, current.id]);
    setRecap({
      outcome: kind === "correct" ? "correct" : "low-confidence",
      message: current.feedback.correct,
      source: primarySource(current),
      pointsEarned: earned,
    });
  }

  function showIncorrect(reason?: string) {
    setRecap({
      outcome: "incorrect",
      message: current.feedback.incorrect,
      reason,
      source: primarySource(current),
      pointsEarned: 0,
    });
  }

  function handleNetworkError(err: unknown) {
    console.error("[TreasureHunt] network error:", err);
    setRecap({
      outcome: "incorrect",
      message:
        "We couldn't reach the server. Check your connection and try again — your progress is safe.",
      pointsEarned: 0,
    });
  }

  // ── HINT ─────────────────────────────────────────────────────────────────
  async function requestHint() {
    setHintLoading(true);
    try {
      const ctx = {
        title: current.title,
        prompt: current.photoPrompt ?? current.question ?? current.description,
        factBody: primaryFactBody(current),
        attemptCount: Math.max(1, attemptCount + 1),
        type: current.type,
      } as const;
      const r = await getHint(ctx);
      setHint(r.hint);
    } catch (err) {
      setHint("Hints are unavailable right now. Look around — what stands out?");
    } finally {
      setHintLoading(false);
    }
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg">Treasure Hunt</h1>
            <p className="text-xs text-emerald-50">
              Challenge {currentIndex + 1} of {challenges.length}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{totalScore}</span>
          </div>
        </div>

        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {recap && recap.outcome !== "low-confidence" ? (
            <RecapCard
              key="recap"
              recap={recap}
              isLast={currentIndex === challenges.length - 1}
              onNext={goToNext}
              onRetry={
                recap.outcome === "incorrect"
                  ? () => {
                      setRecap(null);
                      // keep photoFile / textAnswer so user can adjust
                    }
                  : undefined
              }
            />
          ) : (
            <motion.div
              key={`challenge-${current.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="px-6 py-6 space-y-4"
            >
              {/* Challenge header card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    {current.type === "photo" ? "📷" : "❓"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg mb-1">{current.title}</h2>
                    <p className="text-sm text-stone-600">{current.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{current.location}</span>
                  <span className="ml-auto text-emerald-600">+{current.points} pts</span>
                </div>
              </div>

              {/* PHOTO challenge */}
              {current.type === "photo" && (
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
              )}
              {current.type === "photo" && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhotoPicked}
                  className="hidden"
                />
              )}

              {/* QUESTION challenge */}
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

              {/* Hint card */}
              <HintBlock
                attemptCount={attemptCount}
                loading={hintLoading}
                hint={hint}
                onRequest={requestHint}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══ Sub-components ════════════════════════════════════════════════════════

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

  const isLowConf = recapLowConfidence?.outcome === "low-confidence";

  return (
    <div className="space-y-3">
      <div className="bg-stone-800 text-white rounded-2xl p-4">
        <p className="text-sm leading-relaxed">{prompt}</p>
      </div>

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-[4/3]">
          <img src={preview} alt="Submitted" className="w-full h-full object-cover" />
          {!submitting && !isLowConf && (
            <button
              onClick={onRetake}
              className="absolute bottom-3 left-3 right-3 py-2 bg-white/90 backdrop-blur-sm text-stone-800 rounded-xl text-sm active:scale-95 transition-transform"
            >
              Retake photo
            </button>
          )}
          {submitting && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Verifying photo…</span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={onPick}
          className="w-full aspect-[4/3] border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <Camera className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-center px-6">
            <p className="text-base text-stone-800 mb-1">Take photo</p>
            <p className="text-xs text-stone-500">Tap to open camera</p>
          </div>
        </button>
      )}

      {isLowConf && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-amber-900">{recapLowConfidence?.message}</p>
          {recapLowConfidence?.reason && (
            <p className="text-xs text-amber-700">Vision model said: {recapLowConfidence.reason}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onRetake}
              className="flex-1 py-3 bg-white border border-amber-300 text-amber-900 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={onAcceptAnyway}
              className="flex-1 py-3 bg-amber-600 text-white rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              Submit anyway
            </button>
          </div>
        </div>
      )}

      {preview && !isLowConf && !submitting && (
        <button
          onClick={onSubmit}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl active:scale-[0.98] transition-transform"
        >
          Submit photo
        </button>
      )}
    </div>
  );
}

function QuestionChallenge(props: {
  question: string;
  answer: string;
  setAnswer: (v: string) => void;
  submitting: boolean;
  voiceListening: boolean;
  onVoice: () => void;
  onSubmit: () => void;
}) {
  const { question, answer, setAnswer, submitting, voiceListening, onVoice, onSubmit } = props;

  return (
    <div className="space-y-3">
      <div className="bg-stone-800 text-white rounded-2xl p-4">
        <p className="text-sm leading-relaxed">{question}</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type or speak your answer…"
          className="flex-1 px-3 py-2 outline-none text-sm bg-transparent"
          onKeyDown={(e) => {
            if (e.key === "Enter" && answer.trim() && !submitting) onSubmit();
          }}
        />
        <button
          type="button"
          onClick={onVoice}
          disabled={voiceListening}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            voiceListening
              ? "bg-red-100 text-red-600"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          }`}
          title={voiceListening ? "Listening…" : "Speak your answer"}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={onSubmit}
        disabled={!answer.trim() || submitting}
        className="w-full py-4 bg-emerald-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Grading…
          </>
        ) : (
          "Submit answer"
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
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {hint ? (
            <p className="text-sm text-blue-900 leading-relaxed">{hint}</p>
          ) : (
            <p className="text-sm text-blue-900">
              Stuck? Get a nudge — we won't give the answer away.
            </p>
          )}
          <button
            onClick={onRequest}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </>
            ) : (
              <>I'm stuck — give me a hint{attemptCount > 0 ? ` (${attemptCount + 1})` : ""}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecapCard(props: {
  recap: RecapState;
  isLast: boolean;
  onNext: () => void;
  onRetry?: () => void;
}) {
  const { recap, isLast, onNext, onRetry } = props;
  const isCorrect = recap.outcome === "correct";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center px-6 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
          isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        }`}
      >
        {isCorrect ? (
          <Check className="w-12 h-12" />
        ) : (
          <X className="w-12 h-12" />
        )}
      </motion.div>

      <h2 className="text-2xl mb-2">
        {isCorrect ? "Nice find!" : "Not quite — try again"}
      </h2>

      {isCorrect && recap.pointsEarned > 0 && (
        <p className="text-emerald-700 mb-4">+{recap.pointsEarned} pts</p>
      )}

      <p className="text-stone-700 mb-4 max-w-md">{recap.message}</p>

      {recap.reason && !isCorrect && (
        <p className="text-xs text-stone-500 mb-4 max-w-md">Why: {recap.reason}</p>
      )}

      {recap.source && (
        <a
          href={recap.source.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-amber-700 underline hover:text-amber-800 mb-6"
        >
          📚 Source: {recap.source.label}
        </a>
      )}

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {isCorrect ? (
          <button
            onClick={onNext}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl active:scale-95 transition-transform"
          >
            {isLast ? "View results" : "Next challenge"}
          </button>
        ) : (
          <>
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Try again
              </button>
            )}
            <button
              onClick={onNext}
              className="w-full py-3 bg-white border border-stone-200 text-stone-700 rounded-2xl active:scale-95 transition-transform"
            >
              Skip this one
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
