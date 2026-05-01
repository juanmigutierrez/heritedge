import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, MessageCircle, Volume2, Send, Sparkles,
  Mic, MicOff, Building2, Calendar, Users, Church,
  Pause, Play, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePeriod = "foundations" | "visconti" | "sforza" | "habsburg";
type SuggestedTopic = "architecture" | "history" | "events" | "statues";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;        // short teaser shown immediately
  detail?: string;     // extra content shown / spoken on expand
  followUp?: string;   // Luca's follow-up question after answering
  isExpanded?: boolean;
}

// ─── Luca persona injected into every LLM request ────────────────────────────

const GUIDE_PERSONA = `You are Luca, a warm, enthusiastic, and slightly theatrical heritage guide for Piazza Duomo in Milan.
Your rules:
- Be conversational, friendly, and vivid — never dry or encyclopedic.
- Keep your FIRST answer to exactly 2 sentences (the teaser the user sees first).
- Then write "---DETAIL---" on its own line, followed by 2–3 richer, story-like sentences expanding on the topic.
- Then write "---FOLLOWUP---" on its own line, followed by ONE short, friendly question inviting the user to keep exploring (e.g. "Would you like to hear the legend of the Madonnina, or perhaps the story of Leonardo's contribution?").
- Never use bullet points. Write as if speaking warmly to a curious visitor.
- If the user says yes / sure / tell me more / go on → expand on your last topic with enthusiasm.
- If the user declines → pivot gracefully to another topic suggestion.`;

// ─── Static data ──────────────────────────────────────────────────────────────

const timelineData: Record<TimePeriod, {
  id: TimePeriod; title: string; years: string;
  color: string; bgColor: string; borderColor: string;
  content: string; highlights: string[];
}> = {
  foundations: {
    id: "foundations", title: "Foundations", years: "1386–1400",
    color: "text-stone-700", bgColor: "bg-stone-50", borderColor: "border-stone-300",
    content: "The first stone was laid in 1386. Archbishop Antonio da Saluzzo initiated the project, choosing Gothic style to rival Europe's greatest cathedrals.",
    highlights: ["First stone 1386", "Gothic style chosen", "Deep foundation excavations", "Design by Simone da Orsenigo"],
  },
  visconti: {
    id: "visconti", title: "Visconti Era", years: "1386–1450",
    color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-300",
    content: "Duke Gian Galeazzo Visconti turned the Duomo into a symbol of Milanese ambition — commissioning 3,400+ statues and inviting Europe's finest architects.",
    highlights: ["Funded by Visconti dynasty", "3,400+ statues commissioned", "International architects invited", "Largest Gothic cathedral in Italy"],
  },
  sforza: {
    id: "sforza", title: "Sforza Rule", years: "1450–1535",
    color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-300",
    content: "Leonardo da Vinci himself contributed designs for the tiburio. Spires rose and Renaissance ideas blended beautifully with Gothic bones.",
    highlights: ["Leonardo da Vinci's involvement", "Tiburio construction begins", "Spires take shape", "Renaissance meets Gothic"],
  },
  habsburg: {
    id: "habsburg", title: "Habsburg Period", years: "1535–1700s",
    color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300",
    content: "All 135 spires were completed and the Madonnina — Milan's golden guardian — was placed atop the central spire in 1774, watching over the city ever since.",
    highlights: ["135 spires completed", "Imperial coronations held", "Baroque elements added", "Madonnina placed 1774"],
  },
};

const topicSuggestions: {
  id: SuggestedTopic; title: string; icon: any;
  color: string; bgColor: string; question: string;
}[] = [
  { id: "architecture", title: "Architecture", icon: Building2, color: "text-emerald-700", bgColor: "bg-emerald-50", question: "Tell me about the Gothic architecture of the Duomo" },
  { id: "history",      title: "History",      icon: Church,    color: "text-blue-700",    bgColor: "bg-blue-50",    question: "What's the most fascinating part of the Duomo's history?" },
  { id: "events",       title: "Events",       icon: Calendar,  color: "text-purple-700",  bgColor: "bg-purple-50",  question: "What ceremonies and events happened at the Duomo?" },
  { id: "statues",      title: "Statues",      icon: Users,     color: "text-amber-700",   bgColor: "bg-amber-50",   question: "Tell me about the 3,400 statues — who are they?" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReply(raw: string): { text: string; detail?: string; followUp?: string } {
  const parts = raw.split(/---(?:DETAIL|FOLLOWUP)---/);
  return {
    text:     (parts[0] ?? raw).trim(),
    detail:   parts[1]?.trim() || undefined,
    followUp: parts[2]?.trim() || undefined,
  };
}

function wantsMore(s: string) {
  return /\b(yes|yeah|yep|sure|go on|tell me more|more|please|absolutely|of course|expand|continue|definitely|sounds good|ok|okay)\b/i.test(s);
}

function declinesMore(s: string) {
  return /\b(no|nope|that'?s? (?:ok|fine|enough)|stop|nevermind|skip|not now|maybe later)\b/i.test(s);
}

// ─── AI bubble with expand / hear-more ───────────────────────────────────────

function AIBubble({
  msg, onExpand, onHearMore, isSpeaking,
}: {
  msg: ChatMessage;
  onExpand: (id: string) => void;
  onHearMore: (id: string) => void;
  isSpeaking: boolean;
}) {
  return (
    <div className="flex justify-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1 shadow-sm">
        L
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed text-stone-800 break-words">{msg.text}</p>

          {msg.detail && (
            <>
              <AnimatePresence>
                {msg.isExpanded && (
                  <motion.p
                    key="detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 pt-2 border-t border-stone-100 text-sm leading-relaxed text-stone-500 break-words overflow-hidden"
                  >
                    {msg.detail}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <button
                  onClick={() => onExpand(msg.id)}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
                >
                  {msg.isExpanded
                    ? <><ChevronUp className="w-3 h-3" />Show less</>
                    : <><ChevronDown className="w-3 h-3" />Learn more</>}
                </button>

                {!msg.isExpanded && (
                  <button
                    onClick={() => onHearMore(msg.id)}
                    disabled={isSpeaking}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-500 transition-colors disabled:opacity-40"
                  >
                    <Volume2 className="w-3 h-3" />
                    Hear more
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {msg.followUp && !msg.isExpanded && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-1.5 ml-1 text-xs text-stone-400 italic leading-relaxed"
          >
            {msg.followUp}
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ─── Voice controls cluster ───────────────────────────────────────────────────

function VoiceControls({
  isListening, isSpeaking, isPaused, isLoading,
  onToggleMic, onPause, onResume, onCancel,
}: {
  isListening: boolean; isSpeaking: boolean; isPaused: boolean; isLoading: boolean;
  onToggleMic: () => void; onPause: () => void; onResume: () => void; onCancel: () => void;
}) {
  if (isSpeaking || isPaused) {
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onCancel} aria-label="Cancel"
          className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-4 h-4" />
        </button>
        <button onClick={isPaused ? onResume : onPause} aria-label={isPaused ? "Resume" : "Pause"}
          className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center active:scale-90 transition-transform shadow-md">
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  return (
    <button onClick={onToggleMic} disabled={isLoading} aria-label={isListening ? "Stop" : "Speak"}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 shadow-sm ${
        isListening ? "bg-red-500 text-white" : isLoading ? "bg-stone-100 text-stone-300 cursor-not-allowed" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}>
      {isListening
        ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><MicOff className="w-5 h-5" /></motion.div>
        : <Mic className="w-5 h-5" />}
    </button>
  );
}

// ─── Quick-reply chips ────────────────────────────────────────────────────────

const YES_CHIPS = ["Yes, tell me more! 🙌", "Go on…", "Absolutely!"];
const NO_CHIPS  = ["Maybe later", "Change topic"];

function QuickReplies({ onSelect }: { onSelect: (t: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex flex-wrap gap-2 px-2 pb-1">
      {[...YES_CHIPS, ...NO_CHIPS].map((chip) => (
        <button key={chip} onClick={() => onSelect(chip)}
          className={`px-3 py-1.5 rounded-full text-xs border transition-all active:scale-95 ${
            YES_CHIPS.includes(chip)
              ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
              : "bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100"
          }`}>
          {chip}
        </button>
      ))}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuickGuide() {
  const navigate = useNavigate();
  const [selectedEra, setSelectedEra]         = useState<TimePeriod>("visconti");
  const [showChat, setShowChat]               = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatMessages, setChatMessages]       = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage]       = useState("");
  const [isListening, setIsListening]         = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isSpeaking, setIsSpeaking]           = useState(false);
  const [isPaused, setIsPaused]               = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAIIdRef    = useRef<string>("");
  // Keep a live ref to chatMessages for callbacks that close over stale state
  const msgsRef        = useRef<ChatMessage[]>([]);
  msgsRef.current      = chatMessages;

  const { transcript, listeningState, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoadingResponse, showQuickReplies]);

  // STT DONE → send
  useEffect(() => {
    if (listeningState === "DONE" && transcript) {
      setIsListening(false);
      const text = transcript;
      resetTranscript();
      setInputMessage("");
      handleSendMessageText(text);
    }
    if (listeningState === "IDLE" && isListening) setIsListening(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeningState, transcript]);

  // ── TTS ─────────────────────────────────────────────────────────────────────

  const speakWithState = useCallback((text: string) => {
    setIsSpeaking(true);
    setIsPaused(false);
    speak(text, () => { setIsSpeaking(false); setIsPaused(false); });
  }, []);

  const handlePause = () => {
    if (window.speechSynthesis?.speaking && !window.speechSynthesis?.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true); setIsSpeaking(false);
    }
  };

  const handleResume = () => {
    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false); setIsSpeaking(true);
    }
  };

  const handleCancelSpeech = useCallback(() => {
    stopSpeaking();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false); setIsPaused(false);
  }, []);

  // ── Expand handlers ──────────────────────────────────────────────────────────

  const handleExpand = useCallback((id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        // Speak detail when expanding for the first time
        if (!m.isExpanded && m.detail) speakWithState(m.detail);
        return { ...m, isExpanded: !m.isExpanded };
      })
    );
  }, [speakWithState]);

  const handleHearMore = useCallback((id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id || !m.detail) return m;
        speakWithState(m.detail);
        return { ...m, isExpanded: true };
      })
    );
  }, [speakWithState]);

  // ── Send ─────────────────────────────────────────────────────────────────────

  const handleSendMessageText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    handleCancelSpeech();
    setShowQuickReplies(false);

    // ── "yes, more" shortcut ──
    if (wantsMore(trimmed) && lastAIIdRef.current) {
      const lastMsg = msgsRef.current.find((m) => m.id === lastAIIdRef.current);
      if (lastMsg?.detail) {
        setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
        // Expand + speak detail inline — no new API call needed
        handleHearMore(lastAIIdRef.current);
        return;
      }
    }

    // ── "no thanks" pivot ──
    if (declinesMore(trimmed)) {
      const pivot = "No worries at all! There's so much to explore here — shall I tell you about the architecture, the statues, or perhaps a specific era?";
      setChatMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", text: trimmed },
        { id: `ai-${Date.now()}`, role: "ai", text: pivot },
      ]);
      speakWithState(pivot);
      return;
    }

    // ── Normal LLM call ──
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoadingResponse(true);

    try {
      const res = await sendMessage(
        `${GUIDE_PERSONA}\n\nUser: ${trimmed}`,
        null
      );
      const raw = res.answer || res.reply || "I'd love to help — could you rephrase that?";
      const { text: short, detail, followUp } = parseReply(raw);

      const aiId = `ai-${Date.now()}`;
      lastAIIdRef.current = aiId;
      const aiMsg: ChatMessage = { id: aiId, role: "ai", text: short, detail, followUp, isExpanded: false };
      setChatMessages((prev) => [...prev, aiMsg]);

      // Speak short answer + follow-up question aloud
      speakWithState(followUp ? `${short} … ${followUp}` : short);
      if (followUp) setShowQuickReplies(true);

    } catch {
      const fallback = "Hmm, I seem to have lost my signal for a moment — the marble walls play tricks! Try again and I promise a great story.";
      setChatMessages((prev) => [...prev, { id: `ai-err-${Date.now()}`, role: "ai", text: fallback }]);
      speakWithState(fallback);
    } finally {
      setIsLoadingResponse(false);
    }
  }, [handleCancelSpeech, handleHearMore, speakWithState]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoadingResponse) return;
    handleSendMessageText(inputMessage);
  };

  const handleVoiceToggle = () => {
    if (isListening) { stopListening(); setIsListening(false); }
    else { handleCancelSpeech(); resetTranscript(); startListening(); setIsListening(true); }
  };

  const handleVoiceGuide = () => {
    speakWithState("Welcome to the Duomo di Milano — one of the most breathtaking Gothic cathedrals on Earth. Over 600 years of history, 135 soaring spires, and more than 3,400 statues all compete for your attention. Would you like to explore a specific era, or shall I tell you about the golden Madonnina watching over Milan from above?");
  };

  const statusText = isSpeaking ? "Luca is speaking…" : isPaused ? "Paused" : isListening ? "Listening…" : "Explore different historical periods";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate text-stone-900">Heritage Quick Guide</h1>
            <p className="text-xs text-stone-400 truncate">{statusText}</p>
          </div>
          <button onClick={() => setShowChat(!showChat)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${showChat ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"}`}>
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── CHAT VIEW ─────────────────────────────────────────────────── */}
          {showChat ? (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
              className="flex flex-col h-[calc(100vh-64px)]">

              {/* Luca header */}
              <div className="px-5 py-4 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-700 text-white flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 text-sm">L</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Luca</span>
                    <span className="text-xs text-amber-400">• Heritage Guide</span>
                  </div>
                  <p className="text-xs text-stone-400">Ask me anything — I love a good story 🏛️</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                <AnimatePresence>
                  {isListening && (
                    <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <motion.div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0"
                        animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                      <span className="text-sm text-red-700">I'm listening… tap the mic again when you're done</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {chatMessages.length === 0 && !isListening && !isLoadingResponse && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-3 text-3xl">🏛️</div>
                    <p className="text-stone-800 font-medium mb-1">Ciao! I'm Luca, your guide.</p>
                    <p className="text-stone-400 text-sm mb-5">Ask me anything — or tap a suggestion below.</p>
                    <div className="space-y-2 w-full max-w-xs">
                      {[
                        "What's the most fascinating thing about the Duomo?",
                        "Tell me about Leonardo da Vinci's involvement",
                        "Who is the Madonnina?",
                      ].map((q) => (
                        <button key={q} onClick={() => handleSendMessageText(q)}
                          className="w-full py-2.5 px-4 bg-white border border-stone-200 rounded-xl text-sm text-left text-stone-700 hover:border-amber-300 hover:bg-amber-50 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Message bubbles */}
                {chatMessages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[78%] bg-stone-800 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                          <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      <AIBubble msg={msg} onExpand={handleExpand} onHearMore={handleHearMore} isSpeaking={isSpeaking} />
                    )}
                  </motion.div>
                ))}

                {/* Quick-reply chips */}
                <AnimatePresence>
                  {showQuickReplies && !isLoadingResponse && (
                    <QuickReplies key="chips" onSelect={(chip) => { setShowQuickReplies(false); handleSendMessageText(chip); }} />
                  )}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isLoadingResponse && (
                    <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">L</div>
                      <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center shadow-sm">
                        {[0,1,2].map((i) => (
                          <motion.div key={i} className="w-2 h-2 bg-stone-300 rounded-full"
                            animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-stone-100 px-4 py-3 flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <VoiceControls isListening={isListening} isSpeaking={isSpeaking} isPaused={isPaused} isLoading={isLoadingResponse}
                    onToggleMic={handleVoiceToggle} onPause={handlePause} onResume={handleResume} onCancel={handleCancelSpeech} />
                  <input type="text" value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={isListening ? "Listening…" : isSpeaking ? "Luca is speaking…" : "Ask Luca anything…"}
                    disabled={isListening || isSpeaking || isPaused}
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-amber-400 min-w-0 disabled:text-stone-400 transition-colors" />
                  <button onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoadingResponse || isListening || isSpeaking || isPaused}
                    className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

          ) : (
            /* ── TIMELINE VIEW ─────────────────────────────────────────── */
            <motion.div key="timeline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}
              className="h-[calc(100vh-64px)] overflow-y-auto px-5 py-5 space-y-4">

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-stone-900 to-stone-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-semibold">Time Exploration</h2>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">Six centuries of ambition, faith, and artistry. Select an era to begin.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {(["foundations","visconti","sforza","habsburg"] as TimePeriod[]).map((era) => {
                    const d = timelineData[era]; const sel = selectedEra === era;
                    return (
                      <button key={era} onClick={() => setSelectedEra(era)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border-2 transition-all ${sel ? `${d.borderColor} ${d.bgColor}` : "border-stone-200 bg-stone-50 hover:border-stone-300"}`}>
                        <p className={`text-sm whitespace-nowrap font-medium ${sel ? d.color : "text-stone-600"}`}>{d.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{d.years}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div key={selectedEra} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
                  className={`rounded-2xl border-2 ${timelineData[selectedEra].borderColor} ${timelineData[selectedEra].bgColor} p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">🏛️</div>
                    <div>
                      <h3 className={`text-base font-semibold ${timelineData[selectedEra].color}`}>{timelineData[selectedEra].title}</h3>
                      <p className="text-xs text-stone-400">{timelineData[selectedEra].years}</p>
                    </div>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed mb-3">{timelineData[selectedEra].content}</p>
                  <div className="space-y-1.5">
                    {timelineData[selectedEra].highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full border-2 ${timelineData[selectedEra].borderColor} mt-1.5 flex-shrink-0`} />
                        <p className="text-sm text-stone-600">{h}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-stone-800">Ask Luca about…</h3>
                  </div>
                  <button onClick={() => setShowSuggestions(!showSuggestions)} className="text-xs text-stone-400 hover:text-stone-600">
                    {showSuggestions ? "Less" : "Details"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {topicSuggestions.map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <motion.button key={t.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.28 + i * 0.07 }}
                        onClick={() => { setShowChat(true); handleSendMessageText(t.question); }}
                        className={`${t.bgColor} rounded-xl p-3.5 text-left hover:shadow-md transition-all active:scale-95`}>
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mb-2.5 shadow-sm">
                          <Icon className={`w-4 h-4 ${t.color}`} />
                        </div>
                        <p className={`text-sm font-medium ${t.color}`}>{t.title}</p>
                        {showSuggestions && <p className="text-xs text-stone-500 mt-0.5 leading-snug">{t.question}</p>}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Voice guide button with pause/resume */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                {isSpeaking || isPaused ? (
                  <div className="flex gap-2">
                    <button onClick={handleCancelSpeech} className="flex-1 py-3.5 bg-white border border-stone-200 text-stone-500 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm">
                      <X className="w-4 h-4" /> Stop
                    </button>
                    <button onClick={isPaused ? handleResume : handlePause} className="flex-1 py-3.5 bg-amber-500 text-white rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm shadow-md">
                      {isPaused ? <><Play className="w-4 h-4" />Resume</> : <><Pause className="w-4 h-4" />Pause</>}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleVoiceGuide} className="w-full py-3.5 bg-white border border-stone-200 text-stone-800 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform hover:border-stone-300">
                    <Volume2 className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium">Play Voice Guide</span>
                  </button>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center pb-6">
                <p className="text-xs text-stone-400 mb-2">Have a question for Luca?</p>
                <button onClick={() => setShowChat(true)} className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 text-white rounded-full text-sm active:scale-95 transition-transform hover:bg-stone-800">
                  <MessageCircle className="w-4 h-4" />
                  Chat with Luca
                </button>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}