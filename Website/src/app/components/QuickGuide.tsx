import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, MessageCircle, Volume2, Send, Sparkles,
  Mic, MicOff, Building2, Calendar, Users, Church,
  Pause, Play, X, ChevronDown, ChevronUp, Quote,
} from "lucide-react";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { sendMessage, speak, stopSpeaking, pauseSpeaking, resumeSpeaking } from "@/services/chatService";
import knowledgeBase from "@/content/knowledge-base.json";
import { StoryView } from "./quick-guide/StoryView";
import { eraScenes, type TimePeriod } from "./quick-guide/scenes";

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestedTopic = "architecture" | "history" | "events" | "statues";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  detail?: string;
  followUp?: string;
  isExpanded?: boolean;
  sources?: Array<{ id: string; title: string; url?: string }>;
}

// ─── Luca persona ────────────────────────────────────────────────────────────

const GUIDE_PERSONA = `You are Luca, a warm, enthusiastic, and slightly theatrical heritage guide for Piazza Duomo in Milan.
Your rules:
- Be conversational, friendly, and vivid — never dry or encyclopedic.
- Keep your FIRST answer to exactly 2 sentences (the teaser the user sees first).
- Then write "---DETAIL---" on its own line, followed by 2–3 richer, story-like sentences expanding on the topic.
- Then write "---FOLLOWUP---" on its own line, followed by ONE short, friendly question inviting the user to keep exploring (e.g. "Would you like to hear the legend of the Madonnina, or perhaps the story of Leonardo's contribution?").
- Never use bullet points. Write as if speaking warmly to a curious visitor.
- If the user says yes / sure / tell me more / go on → expand on your last topic with enthusiasm.
- If the user declines → pivot gracefully to another topic suggestion.`;

// ─── Era data — story-driven, with pull quotes and ambient hints ─────────────

const timelineData: Record<TimePeriod, {
  id: TimePeriod;
  title: string;
  years: string;
  era: string;
  pullQuote: string;
  content: string;
  highlights: string[];
  source: { label: string; url?: string };
}> = {
  birth: {
    id: "birth",
    title: "Birth",
    years: "1386 – 1500s",
    era: "the first stone",
    pullQuote: "A city dared to begin a cathedral that would outlive every hand that touched it.",
    content: "Archbishop Antonio da Saluzzo lays the first stone in 1386. Duke Gian Galeazzo Visconti turns the Duomo into a state enterprise — Milan's Gothic answer to Cologne and Reims.",
    highlights: ["First stone, 5 Aug 1386", "Candoglia marble granted in perpetuity", "14 years of foundation excavations", "Fabbrica del Duomo founded 1387"],
    source: { label: "Veneranda Fabbrica del Duomo", url: "https://www.duomomilano.it" },
  },
  crown: {
    id: "crown",
    title: "Crown",
    years: "1500s – 1860",
    era: "the golden age",
    pullQuote: "Leonardo sketched the dome's heart. The Gothic listened, and answered in marble.",
    content: "Renaissance, Habsburg rule, Napoleon. Leonardo submits tiburio designs. The Madonnina rises to 108.5 m. Piermarini rebuilds Palazzo Reale and opens La Scala.",
    highlights: ["Leonardo's tiburio designs, 1487", "Madonnina placed, 30 Dec 1774", "Napoleon's coronation, 1805", "Palazzo Reale rebuilt by Piermarini"],
    source: { label: "Veneranda Fabbrica del Duomo", url: "https://www.duomomilano.it" },
  },
  modern: {
    id: "modern",
    title: "Modern",
    years: "1860 – today",
    era: "the living city",
    pullQuote: "Italy found a stage. The Galleria opened. The square became a city's living room.",
    content: "Italy unifies. Mengoni builds the Galleria. WWII bombs scar Palazzo Reale. Picasso hangs Guernica in the ruins. Today six million visitors a year pass through this square.",
    highlights: ["Galleria opens 1877", "1943 bombing of Sala delle Cariatidi", "Guernica exhibited here, 1953", "6 million visitors/year today"],
    source: { label: "Comune di Milano", url: "https://www.comune.milano.it" },
  },
};

const topicSuggestions: {
  id: SuggestedTopic; title: string; icon: any; question: string; tagline: string;
}[] = [
  { id: "architecture", title: "Architecture", icon: Building2, question: "Tell me about the Gothic architecture of the Duomo", tagline: "Pinnacles, flying buttresses, the geometry of devotion." },
  { id: "history",      title: "History",      icon: Church,    question: "What's the most fascinating part of the Duomo's history?", tagline: "Six centuries condensed into one good story." },
  { id: "events",       title: "Events",       icon: Calendar,  question: "What ceremonies and events happened at the Duomo?", tagline: "Coronations, weddings, the city's loudest moments." },
  { id: "statues",      title: "Statues",      icon: Users,     question: "Tell me about the 3,400 statues — who are they?", tagline: "A frozen crowd of saints, monsters, and patrons." },
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

// ─── AI bubble — token-driven ────────────────────────────────────────────────

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
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
      >
        L
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground break-words">{msg.text}</p>

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
                    className="mt-2 pt-2 border-t border-border text-sm leading-relaxed text-muted-foreground break-words overflow-hidden"
                  >
                    {msg.detail}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  onClick={() => onExpand(msg.id)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: "var(--accent-strong)" }}
                >
                  {msg.isExpanded
                    ? <><ChevronUp className="w-3 h-3" />Show less</>
                    : <><ChevronDown className="w-3 h-3" />Learn more</>}
                </button>

                {!msg.isExpanded && (
                  <button
                    onClick={() => onHearMore(msg.id)}
                    disabled={isSpeaking}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <Volume2 className="w-3 h-3" />
                    Hear more
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="max-w-[90%] px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground">
            <p className="font-semibold mb-1">Sources</p>
            <ul className="space-y-1">
              {msg.sources.map((source) => (
                <li key={source.id}>
                  {source.url ? (
                    <a className="underline hover:text-foreground" href={source.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-strong)" }}>
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {msg.followUp && !msg.isExpanded && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-1.5 ml-1 text-xs italic leading-relaxed font-display"
            style={{ color: "var(--muted-foreground)" }}
          >
            {msg.followUp}
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ─── Voice controls ──────────────────────────────────────────────────────────

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
          className="w-9 h-9 rounded-full bg-secondary text-muted-foreground flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-4 h-4" />
        </button>
        <button onClick={isPaused ? onResume : onPause} aria-label={isPaused ? "Resume" : "Pause"}
          className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  return (
    <button onClick={onToggleMic} disabled={isLoading} aria-label={isListening ? "Stop" : "Speak"}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${
        isListening
          ? "bg-[var(--destructive)] text-white"
          : isLoading
          ? "bg-secondary text-muted-foreground cursor-not-allowed"
          : "bg-secondary text-foreground hover:bg-muted"
      }`}>
      {isListening
        ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}><MicOff className="w-5 h-5" /></motion.div>
        : <Mic className="w-5 h-5" />}
    </button>
  );
}

// ─── Quick replies ────────────────────────────────────────────────────────────

const YES_CHIPS = ["Yes, tell me more!", "Go on…", "Absolutely"];
const NO_CHIPS  = ["Maybe later", "Change topic"];

function QuickReplies({ onSelect }: { onSelect: (t: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="flex flex-wrap gap-2 px-2 pb-1">
      {[...YES_CHIPS, ...NO_CHIPS].map((chip) => {
        const isYes = YES_CHIPS.includes(chip);
        return (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="px-3 py-1.5 rounded-full text-xs border transition-all active:scale-95"
            style={
              isYes
                ? { background: "color-mix(in srgb, var(--accent) 15%, transparent)", borderColor: "var(--accent)", color: "var(--accent-strong)" }
                : { background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {chip}
          </button>
        );
      })}
    </motion.div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

const timelinePeriods: TimePeriod[] = ["birth", "crown", "modern"];

function TopicCard({ topic, onSelect, delay }: {
  topic: typeof topicSuggestions[number];
  onSelect: () => void;
  delay: number;
}) {
  const Icon = topic.icon;
  return (
    <motion.button
      key={topic.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onSelect}
      className="bg-card border border-border rounded-2xl p-4 text-left hover:border-[var(--border-strong)] hover:bg-secondary transition-all active:scale-[0.98]"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent-strong)" }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-foreground">{topic.title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{topic.tagline}</p>
    </motion.button>
  );
}

function SourceBadge({ label, url }: { label: string; url?: string }) {
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-foreground" style={{ color: "var(--accent-strong)" }}>
      {label}
    </a>
  ) : (
    <span>{label}</span>
  );
}

function EmptyChatState({ onPrompt }: { onPrompt: (text: string) => void }) {
  const prompts = useMemo(() => [
    "What's the most fascinating thing about the Duomo?",
    "Tell me about Leonardo da Vinci's involvement",
    "Who is the Madonnina?",
  ], []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-8 text-center px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-2xl font-display font-medium"
        style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent-strong)" }}
      >
        L
      </div>
      <p className="text-foreground font-medium mb-1">Ciao! I'm Luca, your guide.</p>
      <p className="text-muted-foreground text-sm mb-5 max-w-md">Ask me anything, or pick a starter below.</p>
      <div className="space-y-2 w-full max-w-xs">
        {prompts.map((prompt) => (
          <button key={prompt} onClick={() => onPrompt(prompt)}
            className="w-full py-2.5 px-4 bg-card border border-border rounded-xl text-sm text-left text-foreground hover:border-[var(--accent)] hover:bg-secondary transition-colors">
            {prompt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg, onExpand, onHearMore, isSpeaking }: {
  msg: ChatMessage;
  onExpand: (id: string) => void;
  onHearMore: (id: string) => void;
  isSpeaking: boolean;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] rounded-2xl rounded-tr-sm px-4 py-3"
          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <p className="text-sm leading-relaxed break-words">{msg.text}</p>
        </div>
      </div>
    );
  }
  return <AIBubble msg={msg} onExpand={onExpand} onHearMore={onHearMore} isSpeaking={isSpeaking} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function QuickGuide() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedEra, setSelectedEra]         = useState<TimePeriod>("birth");
  const [showChat, setShowChat]               = useState(false);
  const [storyOpen, setStoryOpen]             = useState(false);
  const [storyIndex, setStoryIndex]           = useState(0);
  // True when the user opened the chat via an "Ask Luca" button inside the
  // StoryView. Lets the chat's Back button return the user to the same scene
  // they were on instead of dropping them on the era cards.
  const [cameFromStory, setCameFromStory]     = useState(false);
  const [chatMessages, setChatMessages]       = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage]       = useState("");
  const [isListening, setIsListening]         = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isSpeaking, setIsSpeaking]           = useState(false);
  const [isPaused, setIsPaused]               = useState(false);
  const [speakingEra, setSpeakingEra]         = useState<TimePeriod | null>(null);
  const [showAudioUnlock, setShowAudioUnlock] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastAIIdRef    = useRef<string>("");
  const askFiredRef    = useRef(false);
  const msgsRef        = useRef<ChatMessage[]>([]);
  msgsRef.current      = chatMessages;

  const { transcript, listeningState, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  const selectedFact = useMemo(() => {
    try {
      const kb: any = knowledgeBase;
      const mapping: Record<TimePeriod, string> = {
        birth:   "duomo-1386-foundation",
        crown:   "duomo-madonnina-1774",
        modern:  "galleria-mengoni-1865",
      };
      const factId = mapping[selectedEra];
      return kb.facts.find((f: any) => f.id === factId) ?? null;
    } catch {
      return null;
    }
  }, [selectedEra]);

  const isChatBusy = isLoadingResponse || isListening || isSpeaking || isPaused;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoadingResponse, showQuickReplies]);

  // Sync local speaking state with the global luca-speech bus so pill controls
  // (pause/stop) stay in sync with this component's UI.
  useEffect(() => {
    const handle = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "start" || detail === "resume") {
        setIsSpeaking(true); setIsPaused(false);
      } else if (detail === "pause") {
        setIsPaused(true); setIsSpeaking(false);
      } else if (detail === "end") {
        setIsSpeaking(false); setIsPaused(false); setSpeakingEra(null);
      }
    };
    window.addEventListener("luca-speech", handle);
    return () => window.removeEventListener("luca-speech", handle);
  }, []);

  // Handle ?ask=<question> deep-link — open chat pre-filled.
  useEffect(() => {
    if (askFiredRef.current) return;
    const ask = searchParams.get("ask");
    if (!ask) return;
    askFiredRef.current = true;
    setShowChat(true);
    setSearchParams({}, { replace: true });
    setTimeout(() => handleSendMessageText(ask), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  useEffect(() => {
    setStoryIndex(0);
  }, [selectedEra]);

  const speakWithState = useCallback((text: string) => {
    setIsSpeaking(true);
    setIsPaused(false);
    speak(text, () => { setIsSpeaking(false); setIsPaused(false); });
  }, []);

  const handlePause = () => { pauseSpeaking(); };

  const handleResume = () => { resumeSpeaking(); };

  const handleCancelSpeech = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false); setIsPaused(false); setSpeakingEra(null);
  }, []);

  const handleExpand = useCallback((id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
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

  const handleSendMessageText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    handleCancelSpeech();
    setShowQuickReplies(false);

    if (wantsMore(trimmed) && lastAIIdRef.current) {
      const lastMsg = msgsRef.current.find((m) => m.id === lastAIIdRef.current);
      if (lastMsg?.detail) {
        setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
        handleHearMore(lastAIIdRef.current);
        return;
      }
    }

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

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoadingResponse(true);

    try {
      const res = await sendMessage(`${GUIDE_PERSONA}\n\nUser: ${trimmed}`, null);
      const raw = res.answer || res.reply || "I'd love to help — could you rephrase that?";
      const { text: short, detail, followUp } = parseReply(raw);
      const aiId = `ai-${Date.now()}`;
      lastAIIdRef.current = aiId;
      const aiMsg: ChatMessage = {
        id: aiId,
        role: "ai",
        text: short,
        detail,
        followUp,
        isExpanded: false,
        sources: res.sources,
      };
      setChatMessages((prev) => [...prev, aiMsg]);
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

  const handleSendMessage = useCallback(() => {
    handleSendMessageText(inputMessage);
  }, [inputMessage, handleSendMessageText]);

  const handleVoiceToggle = () => {
    if (isListening) { stopListening(); setIsListening(false); return; }
    handleCancelSpeech();
    resetTranscript();
    startListening();
    setIsListening(true);
  };

  const handleVoiceGuide = () => {
    const currentEra = selectedEra;
    setSpeakingEra(currentEra);
    const eraData = timelineData[currentEra];
    speakWithState(`${eraData.title}, ${eraData.years}. ${eraData.content}`);
  };

  const handleBeginChapter = () => {
    if (!localStorage.getItem("luca-audio-unlocked")) {
      setShowAudioUnlock(true);
    } else {
      setStoryOpen(true);
    }
  };

  const handleAudioUnlock = () => {
    // iOS requires speechSynthesis.speak() in a direct user-gesture handler
    const u = new SpeechSynthesisUtterance(" ");
    window.speechSynthesis?.speak(u);
    window.speechSynthesis?.cancel();
    localStorage.setItem("luca-audio-unlocked", "1");
    setShowAudioUnlock(false);
    setStoryOpen(true);
  };

  // Era progression — what number are we on?
  const eraIndex = timelinePeriods.indexOf(selectedEra);
  const totalEras = timelinePeriods.length;

  const era = timelineData[selectedEra];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-3 sm:px-8 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-caption">Heritage Quick Guide</p>
            <p className="text-xs text-muted-foreground -mt-0.5">A six-century journey, told in three chapters</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showChat ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col min-h-[calc(100dvh-64px)]"
          >
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-card">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                L
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Luca</span>
                  <span className="text-xs" style={{ color: "var(--accent-strong)" }}>· Heritage Guide</span>
                </div>
                <p className="text-xs text-muted-foreground">Ask me anything — I love a good story.</p>
              </div>
              <button
                onClick={() => {
                  setShowChat(false);
                  // If the user opened the chat from inside the StoryView,
                  // drop them back into the same scene instead of the era cards.
                  if (cameFromStory) {
                    setStoryOpen(true);
                    setCameFromStory(false);
                  }
                }}
                aria-label="Back to journey"
                className="w-9 h-9 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 sm:px-5 sm:py-5 max-w-3xl mx-auto w-full">
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    key="listen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{
                      background: "color-mix(in srgb, var(--destructive) 12%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                      color: "var(--destructive)",
                    }}
                  >
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--destructive)" }}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                    <span className="text-sm">I'm listening… tap the mic again when you're done.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {chatMessages.length === 0 && !isListening && !isLoadingResponse && (
                <EmptyChatState onPrompt={handleSendMessageText} />
              )}

              {chatMessages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <ChatMessage msg={msg} onExpand={handleExpand} onHearMore={handleHearMore} isSpeaking={isSpeaking} />
                </motion.div>
              ))}

              <AnimatePresence>
                {showQuickReplies && !isLoadingResponse && (
                  <QuickReplies key="chips" onSelect={(chip) => { setShowQuickReplies(false); handleSendMessageText(chip); }} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isLoadingResponse && (
                  <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      L
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "var(--muted-foreground)" }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-border px-4 py-3 flex-shrink-0 bg-card">
              <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center">
                <VoiceControls
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isPaused={isPaused}
                  isLoading={isLoadingResponse}
                  onToggleMic={handleVoiceToggle}
                  onPause={handlePause}
                  onResume={handleResume}
                  onCancel={handleCancelSpeech}
                />
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={isListening ? "Listening…" : isSpeaking ? "Luca is speaking…" : "Ask Luca anything…"}
                  disabled={isChatBusy}
                  className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-full text-sm text-foreground focus:outline-none focus:border-[var(--accent)] min-w-0 disabled:opacity-60 transition-colors"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isChatBusy}
                  className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform flex-shrink-0"
                  style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="max-w-3xl mx-auto px-5 sm:px-8 pb-12"
          >
            {/* CINEMATIC HERO */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-6 rounded-3xl overflow-hidden border border-border"
              style={{
                background:
                  "linear-gradient(135deg, #14110F 0%, #25201D 60%, #3a2a18 100%)",
                minHeight: "260px",
              }}
            >
              {/* faint grid texture for depth */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, #E5B948 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative p-6 sm:p-8 flex flex-col gap-3">
                <div
                  className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.2em] uppercase"
                  style={{
                    background: "color-mix(in srgb, #E5B948 20%, transparent)",
                    border: "0.5px solid color-mix(in srgb, #E5B948 50%, transparent)",
                    color: "#E5B948",
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Six centuries · three chapters</span>
                </div>

                <h1 className="hero-title text-white" style={{ fontSize: "clamp(2rem, 6vw, 2.75rem)", lineHeight: 1.05 }}>
                  Time Exploration
                </h1>

                <p className="text-sm sm:text-base text-white/75 max-w-md leading-snug">
                  Walk the Duomo's story from a single laid stone to the gilded
                  Madonna at its peak. Tap a chapter to begin.
                </p>

                {/* Reading progress dots */}
                <div className="mt-4 flex items-center gap-2">
                  {timelinePeriods.map((era, i) => {
                    const visited = i <= eraIndex;
                    return (
                      <div
                        key={era}
                        className="h-[3px] flex-1 rounded-full transition-all"
                        style={{
                          background: visited ? "#E5B948" : "rgba(237,230,218,0.18)",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-white/55 tracking-wider uppercase">
                  Chapter {eraIndex + 1} of {totalEras}
                </p>
              </div>
            </motion.div>

            {/* TIMELINE STRIP — visual era selector */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6"
            >
              <div className="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {timelinePeriods.map((id) => {
                  const data = timelineData[id];
                  const isActive = selectedEra === id;
                  const i = timelinePeriods.indexOf(id);
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedEra(id)}
                      className="flex-1 min-w-[8.5rem] text-left rounded-2xl border transition-all active:scale-[0.98] p-3"
                      style={{
                        background: isActive ? "var(--accent)" : "var(--card)",
                        borderColor: isActive ? "var(--accent)" : "var(--border)",
                        color: isActive ? "var(--accent-foreground)" : "var(--foreground)",
                      }}
                    >
                      <div
                        className="text-[10px] tracking-[0.16em] uppercase font-medium"
                        style={{
                          color: isActive ? "var(--accent-foreground)" : "var(--muted-foreground)",
                          opacity: isActive ? 0.85 : 1,
                        }}
                      >
                        Chapter {i + 1}
                      </div>
                      <div className="mt-1 text-sm font-medium leading-tight">{data.title}</div>
                      <div
                        className="text-[11px] mt-0.5"
                        style={{
                          color: isActive ? "var(--accent-foreground)" : "var(--muted-foreground)",
                          opacity: isActive ? 0.75 : 1,
                        }}
                      >
                        {data.years}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* ERA STORY CARD */}
            <AnimatePresence mode="wait">
              <motion.section
                key={selectedEra}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.32 }}
                className="mt-6 bg-card border border-border rounded-3xl overflow-hidden"
              >
                {/* Era header */}
                <header className="px-5 sm:px-7 pt-6 sm:pt-8">
                  <p className="text-caption" style={{ color: "var(--accent-strong)" }}>
                    {era.years} · {era.era}
                  </p>
                  <h2 className="h2 mt-2 text-foreground">{era.title}</h2>
                </header>

                {/* Pull quote — the dramatic, emotional anchor */}
                <figure className="px-5 sm:px-7 mt-5">
                  <div
                    className="relative rounded-2xl px-5 py-5 sm:px-6 sm:py-6"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent) 12%, transparent)",
                      borderLeft: "3px solid var(--accent)",
                    }}
                  >
                    <Quote
                      className="absolute -top-2 -left-2 w-5 h-5 opacity-80"
                      style={{ color: "var(--accent)" }}
                      aria-hidden
                    />
                    <blockquote
                      className="font-display italic text-base sm:text-lg leading-snug text-foreground"
                      style={{ letterSpacing: "-0.005em" }}
                    >
                      “{era.pullQuote}”
                    </blockquote>
                  </div>
                </figure>

                {/* Narrative paragraph */}
                <div className="px-5 sm:px-7 mt-5">
                  <p className="text-[15px] leading-relaxed text-foreground">
                    {selectedFact?.body ?? era.content}
                  </p>
                </div>

                {/* Source */}
                <div className="px-5 sm:px-7 mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-caption">Source</span>
                  <SourceBadge
                    label={selectedFact?.source?.label ?? era.source.label}
                    url={selectedFact?.source?.url ?? era.source.url}
                  />
                </div>

                {/* Highlights as chips */}
                <div className="px-5 sm:px-7 mt-5 pb-6 sm:pb-7">
                  <p className="text-caption mb-3">Beats</p>
                  <div className="flex flex-wrap gap-2">
                    {era.highlights.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border bg-secondary text-foreground"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Primary action: enter the story player */}
                <div className="px-5 sm:px-7 pb-3">
                  {(isSpeaking || isPaused) && speakingEra === selectedEra ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleCancelSpeech}
                        className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm bg-secondary text-foreground border border-border"
                      >
                        <X className="w-4 h-4" /> Stop
                      </button>
                      <button
                        onClick={isPaused ? handleResume : handlePause}
                        className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm font-medium"
                        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                      >
                        {isPaused ? <><Play className="w-4 h-4" />Resume</> : <><Pause className="w-4 h-4" />Pause</>}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleBeginChapter}
                      className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm font-medium"
                      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Begin chapter
                      <span aria-hidden>→</span>
                    </button>
                  )}
                </div>

                {/* Secondary actions */}
                {!((isSpeaking || isPaused) && speakingEra === selectedEra) && (
                  <div className="px-5 sm:px-7 pb-6 sm:pb-7 flex flex-col sm:flex-row gap-2 text-sm">
                    <button
                      onClick={handleVoiceGuide}
                      className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <Volume2 className="w-4 h-4" />
                      Listen to summary
                    </button>
                    <button
                      onClick={() => setShowChat(true)}
                      className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ask Luca
                    </button>
                  </div>
                )}
              </motion.section>
            </AnimatePresence>

            {/* "Ask Luca about" topic grid */}
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: "var(--accent-strong)" }} />
                <h3 className="text-base font-medium text-foreground">Or wander off the main path…</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topicSuggestions.map((topic, index) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    onSelect={() => { setShowChat(true); handleSendMessageText(topic.question); }}
                    delay={0.22 + index * 0.06}
                  />
                ))}
              </div>
            </motion.section>

            {/* Footer note */}
            <p className="mt-10 text-center text-xs text-muted-foreground">
              Curated from the Veneranda Fabbrica del Duomo &amp; Archivio Storico Civico di Milano.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio unlock splash — shown on first "Begin chapter" tap */}
      <AnimatePresence>
        {showAudioUnlock && (
          <motion.div
            key="audio-unlock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-6"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="w-full max-w-sm rounded-3xl p-7 text-center"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                L
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Enable Luca's voice</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Tap below to let Luca narrate your journey. You can pause or stop at any time.
              </p>
              <button
                onClick={handleAudioUnlock}
                className="w-full py-3.5 rounded-2xl text-sm font-medium active:scale-[0.98] transition-transform"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                <Volume2 className="w-4 h-4 inline mr-2" />
                Tap to begin
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap-through chapter player */}
      <AnimatePresence>
        {storyOpen && (
          <StoryView
            chapterTitle={era.title}
            chapterYears={era.years}
            chapterIndex={eraIndex}
            totalChapters={timelinePeriods.length}
            scenes={eraScenes[selectedEra]}
            initialIndex={storyIndex}
            onIndexChange={setStoryIndex}
            onClose={() => setStoryOpen(false)}
            onComplete={() => {
              const next = timelinePeriods[eraIndex + 1];
              if (next) {
                setSelectedEra(next);
              } else {
                setStoryOpen(false);
                navigate("/ar-overview");
              }
            }}
            onAskLuca={(prompt, returnIndex) => {
              if (typeof returnIndex === "number") setStoryIndex(returnIndex);
              setStoryOpen(false);
              setShowChat(true);
              setCameFromStory(true);
              if (prompt) setInputMessage(prompt);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
