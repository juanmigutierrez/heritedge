import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Send, Mic, MicOff } from "lucide-react";
import { sendMessage } from "@/services/chatService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSource {
  id: string;
  title: string;
  url?: string;
}

const suggestedPrompts = [
  "Tell me about the Duomo history",
  "What changed over time?",
  "Why is this place important?",
  "When was the Galleria built?",
  "What happened during the war?",
];

export function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm here to answer your questions about Piazza Duomo's heritage. I can share information about the Duomo, Galleria, Palazzo Reale, and their historical significance. What would you like to know?",
    },
  ]);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    sendMessage(userText, "duomo")
      .then((res) => {
        const responseContent = res.answer || res.reply || "I could not generate an answer.";
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
        };

        setSources(res.sources ?? []);
        setMessages(prev => [...prev, aiMessage]);
      })
      .catch(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't reach the knowledge base right now. Please try again.",
        };

        setMessages(prev => [...prev, aiMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    setInputValue("");
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate voice recognition
      setTimeout(() => {
        setInputValue("Tell me about the Duomo history");
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg">AI Heritage Assistant</h1>
            <p className="text-xs text-stone-500">Ask about curated heritage sites</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-stone-800 text-white"
                  : "bg-white text-stone-800 shadow-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </motion.div>
        ))}
        {sources.length > 0 && (
          <div className="text-xs text-stone-500 px-1">
            <p className="mb-1 uppercase tracking-wide">Sources</p>
            <ul className="space-y-1">
              {sources.map((source) => (
                <li key={source.id}>
                  {source.url ? (
                    <a className="text-emerald-700 underline" href={source.url} target="_blank" rel="noreferrer">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-stone-500 mb-2 px-1">Suggested questions:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-full text-sm whitespace-nowrap active:scale-95 transition-transform"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trust Message */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-800 text-center">
          💡 I can answer about the selected heritage site and related curated topics
        </p>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 py-4">
        <div className="flex items-end gap-2">
          <button
            onClick={toggleVoiceInput}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isListening ? "bg-red-500 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 bg-stone-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask a question..."}
              className="flex-1 bg-transparent outline-none text-sm"
              disabled={isListening}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-stone-800 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
