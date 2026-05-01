import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Send, Mic, MicOff, Pause, Play, X } from "lucide-react";
import { useVoiceService } from "@/services/voiceService";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  detailedContent?: string;
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const suggestedPrompts = [
  "Tell me about the Duomo history",
  "What changed over time?",
  "Why is this place important?",
  "When was the Galleria built?",
  "What happened during the war?",
];

// ─── Static response bank ────────────────────────────────────────────────────

const aiResponses: Record<string, { short: string; detailed: string }> = {
  "tell me about the duomo history": {
    short:
      "Construction began in 1386 and took nearly 600 years to complete. It's one of Italy's largest Gothic cathedrals, with over 3,400 statues.",
    detailed:
      "The Duomo di Milano's history began in 1386 under Archbishop Antonio da Saluzzo. The cathedral showcases stunning Gothic architecture with 3,400+ statues and 135 spires. Its pink-white Candoglia marble was sourced from a quarry near Lake Maggiore, and the iconic Madonnina statue was placed on top in 1775.",
  },
  "what changed over time?": {
    short:
      "The medieval structure was enhanced during the Renaissance, then restored after WWII bomb damage. Modern conservation continues today.",
    detailed:
      "Famous architects like Bramante contributed Renaissance enhancements. Allied bombing in WWII caused damage that required post-war restoration. Today, ongoing conservation preserves the Candoglia marble facade while maintaining historical integrity.",
  },
  "why is this place important?": {
    short:
      "Piazza Duomo is Milan's symbolic heart — witness to coronations, protests, and liberation. The Duomo is the third-largest church in Europe.",
    detailed:
      "The square embodies Milanese identity across centuries: it hosted royal coronations, popular uprisings, WWII liberation celebrations, and contemporary cultural events. The cathedral itself took nearly 600 years to complete, making it a monument to collective effort and civic pride.",
  },
  "when was the galleria built?": {
    short:
      "Built 1865–1877, designed by Giuseppe Mengoni. It's among the world's oldest shopping malls, famed for its glass-vaulted arcade.",
    detailed:
      "The Galleria Vittorio Emanuele II connects Piazza Duomo to Teatro alla Scala. Mengoni's iron-and-glass roof and intricate mosaic floors were revolutionary for their time. Tragically, Mengoni died after falling from the building during the final construction phase.",
  },
  "what happened during the war?": {
    short:
      "Milan suffered heavy WWII bombing, but the Duomo survived. The square became a focal point of liberation celebrations in April 1945.",
    detailed:
      "Many surrounding buildings were destroyed and rebuilt in the 1950s, but the Duomo was largely spared — local legend credits the Madonnina's protection. Liberation Day on 25 April 1945 saw crowds fill the square; the event is commemorated annually.",
  },
};

function getAIResponse(query: string): { short: string; detailed: string } {
  const q = query.toLowerCase();
  const key = Object.keys(aiResponses).find(
    (k) => q.includes(k) || k.includes(q.split(" ").slice(0, 3).join(" "))
  );
  return (
    key
      ? aiResponses[key]
      : {
          short:
            "I can answer questions about Piazza Duomo's heritage sites: the Duomo, Galleria, and Palazzo Reale.",
          detailed:
            "Please ask about the Duomo di Milano, Galleria Vittorio Emanuele II, or Palazzo Reale — their architecture, history, or cultural significance.",
        }
  );
}

// ─── Mic button ───────────────────────────────────────────────────────────────

interface MicButtonProps {
  listeningState: string;
  isSpeaking: boolean;
  isPaused: boolean;
  onToggle: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

function MicButton({
  listeningState,
  isSpeaking,
  isPaused,
  onToggle,
  onPause,
  onResume,
  onCancel,
}: MicButtonProps) {
  // While TTS is active show Pause/Resume/Cancel cluster
  if (isSpeaking || isPaused) {
    return (
      <div className="flex items-center gap-1">
        {/* Cancel */}
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pause / Resume */}
        <button
          onClick={isPaused ? onResume : onPause}
          className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center active:scale-90 transition-transform shadow-md"
          aria-label={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  const isListening = listeningState === "LISTENING";
  const isProcessing = listeningState === "PROCESSING";

  return (
    <button
      onClick={onToggle}
      disabled={isProcessing}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm ${
        isListening
          ? "bg-red-500 text-white animate-pulse"
          : isProcessing
          ? "bg-stone-300 text-stone-400 cursor-not-allowed"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 ${
          isAssistant
            ? "bg-white text-stone-800 shadow-sm border border-stone-100"
            : "bg-stone-800 text-white"
        }`}
      >
        {/* Main (short) content — never overflows */}
        <p className="text-sm leading-relaxed break-words">{message.content}</p>

        {/* Expand / collapse detail */}
        {isAssistant && message.detailedContent && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
            >
              {expanded ? "Show less ▲" : "Learn more ▼"}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="mt-2 pt-2 border-t border-stone-100 text-sm leading-relaxed text-stone-500 break-words">
                    {message.detailedContent}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! Ask me anything about Piazza Duomo — the cathedral, the Galleria, or Palazzo Reale.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Voice integration ────────────────────────────────────────────────────
  const handleVoiceAnswer = useCallback(
    (question: string, answer: string) => {
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
      };
      const { short, detailed } = getAIResponse(question);
      const aiMsg: Message = {
        id: `a-${Date.now() + 1}`,
        role: "assistant",
        content: short,
        detailedContent: detailed !== short ? detailed : undefined,
      };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      // Keep inputValue clean after voice
      setInputValue("");
    },
    []
  );

  const { listeningState, isSpeaking, isPaused, transcript, toggleListening, pause, resume, cancel } =
    useVoiceService({ onAnswer: handleVoiceAnswer });

  // Show interim transcript in the input box
  useEffect(() => {
    if (listeningState === "LISTENING" && transcript) {
      setInputValue(transcript);
    }
  }, [transcript, listeningState]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Text send ────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const { short, detailed } = getAIResponse(text);
      const aiMsg: Message = {
        id: `a-${Date.now() + 1}`,
        role: "assistant",
        content: short,
        detailedContent: detailed !== short ? detailed : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length <= 1 && listeningState === "IDLE" && !isSpeaking;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-medium truncate">AI Heritage Assistant</h1>
            <p className="text-xs text-stone-500 truncate">
              {isSpeaking
                ? "Speaking…"
                : isPaused
                ? "Paused"
                : listeningState === "LISTENING"
                ? "Listening…"
                : listeningState === "PROCESSING"
                ? "Processing…"
                : "Ask about curated heritage sites"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageBubble message={msg} />
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-stone-100 shadow-sm rounded-2xl px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested prompts ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-2"
          >
            <p className="text-xs text-stone-400 mb-2 px-1">Try asking:</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(prompt)}
                  className="px-3 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-full text-xs whitespace-nowrap active:scale-95 transition-transform hover:border-stone-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trust strip ───────────────────────────────────────────────────── */}
      <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-700 text-center leading-tight">
          💡 Answers cover the Duomo, Galleria, and Palazzo Reale
        </p>
      </div>

      {/* ── Input area ────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Mic / Pause / Resume cluster */}
          <MicButton
            listeningState={listeningState}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onToggle={toggleListening}
            onPause={pause}
            onResume={resume}
            onCancel={cancel}
          />

          {/* Text input */}
          <div className="flex-1 bg-stone-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                listeningState === "LISTENING"
                  ? "Listening…"
                  : isSpeaking
                  ? "Speaking…"
                  : "Ask a question…"
              }
              className="flex-1 bg-transparent outline-none text-sm placeholder-stone-400 min-w-0"
              disabled={listeningState === "LISTENING" || isSpeaking || isPaused}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || listeningState === "LISTENING" || isSpeaking || isPaused}
            className="w-12 h-12 rounded-full bg-stone-800 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-transform shadow-sm flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}