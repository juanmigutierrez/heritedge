import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Send, Mic, MicOff } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  "Tell me about the Duomo history",
  "What changed over time?",
  "Why is this place important?",
  "When was the Galleria built?",
  "What happened during the war?",
];

const aiResponses: Record<string, string> = {
  "tell me about the duomo history": "The Duomo di Milano's history began in 1386 when construction started under Archbishop Antonio da Saluzzo. It took nearly 600 years to complete! The cathedral showcases stunning Gothic architecture with over 3,400 statues and 135 spires, making it one of the largest churches in Italy.",
  "what changed over time?": "Over the centuries, the Duomo has witnessed significant changes. The original medieval structure was enhanced during the Renaissance. Post-WWII restoration repaired war damage. Modern conservation efforts maintain its pink-white Candoglia marble facade while preserving historical integrity.",
  "why is this place important?": "Piazza Duomo represents Milan's heart and soul. It's a symbol of resilience, having survived wars and witnessed coronations, protests, and celebrations. The square embodies Milanese identity, connecting past with present through architecture, culture, and community.",
  "when was the galleria built?": "The Galleria Vittorio Emanuele II was built between 1865 and 1877. Designed by architect Giuseppe Mengoni, it's one of the world's oldest shopping malls, featuring a stunning glass-vaulted arcade connecting Piazza Duomo to Teatro alla Scala.",
  "what happened during the war?": "During WWII, Milan suffered heavy bombing. The Duomo was damaged but remarkably survived. The square was a focal point during liberation in 1945. Post-war reconstruction focused on preserving heritage while modernizing the city.",
};

export function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm here to answer your questions about Piazza Duomo's heritage. I can share information about the Duomo, Galleria, Palazzo Reale, and their historical significance. What would you like to know?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const query = inputValue.toLowerCase();
      let responseContent = "";

      // Find matching response
      const matchedKey = Object.keys(aiResponses).find(key => 
        query.includes(key) || key.includes(query.split(" ").slice(0, 3).join(" "))
      );

      if (matchedKey) {
        responseContent = aiResponses[matchedKey];
      } else {
        responseContent = "I apologize, but I can only answer questions about the curated heritage sites in Piazza Duomo: the Duomo di Milano, Galleria Vittorio Emanuele II, and Palazzo Reale. Could you ask about one of these landmarks or their historical significance?";
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

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
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-full bg-stone-800 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
