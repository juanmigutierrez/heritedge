import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MessageCircle, Volume2, Send, Sparkles, Mic, Building2, Calendar, Users, Church } from "lucide-react";

type TimePeriod = "foundations" | "visconti" | "sforza" | "habsburg";
type SuggestedTopic = "architecture" | "history" | "events" | "statues";

interface TimelineEra {
  id: TimePeriod;
  title: string;
  years: string;
  color: string;
  bgColor: string;
  borderColor: string;
  content: string;
  highlights: string[];
}

interface TopicSuggestion {
  id: SuggestedTopic;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
}

const timelineData: Record<TimePeriod, TimelineEra> = {
  foundations: {
    id: "foundations",
    title: "Foundations",
    years: "1386-1400",
    color: "text-stone-700",
    bgColor: "bg-stone-50",
    borderColor: "border-stone-300",
    content: "The first stone was laid in 1386. Archbishop Antonio da Saluzzo initiated the project, choosing Gothic style to rival other European cathedrals. The foundation work was massive, requiring deep excavations.",
    highlights: [
      "First stone laid in 1386",
      "Gothic style chosen",
      "Massive foundation excavations",
      "Initial design by Simone da Orsenigo",
    ],
  },
  visconti: {
    id: "visconti",
    title: "Visconti Era",
    years: "1386-1450",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    content: "Under Duke Gian Galeazzo Visconti, the Duomo became a symbol of Milanese power. The Visconti family funded construction generously, aiming to create the largest Gothic cathedral in Italy.",
    highlights: [
      "Funded by Visconti dynasty",
      "Symbol of Milanese power",
      "Over 3,400 statues commissioned",
      "International architects invited",
    ],
  },
  sforza: {
    id: "sforza",
    title: "Sforza Rule",
    years: "1450-1535",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    content: "The Sforza dynasty continued the work, adding their artistic vision. Leonardo da Vinci even contributed designs for the tiburio (central tower). Construction progressed on the spires and facades.",
    highlights: [
      "Leonardo da Vinci's involvement",
      "Tiburio construction begins",
      "Spires take shape",
      "Renaissance influences blend in",
    ],
  },
  habsburg: {
    id: "habsburg",
    title: "Habsburg Period",
    years: "1535-1700s",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    content: "Under Habsburg Spanish and Austrian rule, work continued steadily. The 135 spires were completed during this era. The cathedral became a site of imperial coronations and ceremonies.",
    highlights: [
      "135 spires completed",
      "Imperial coronations held",
      "Baroque elements added",
      "Central spire with Madonnina erected",
    ],
  },
};

const topicSuggestions: TopicSuggestion[] = [
  {
    id: "architecture",
    title: "Architecture",
    icon: Building2,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    description: "Explore Gothic architecture, spires, and construction techniques",
  },
  {
    id: "history",
    title: "History",
    icon: Church,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    description: "Learn about historical events and key moments",
  },
  {
    id: "events",
    title: "Events",
    icon: Calendar,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    description: "Discover ceremonies, coronations, and celebrations",
  },
  {
    id: "statues",
    title: "Statues",
    icon: Users,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    description: "Explore the 3,400+ statues and their meanings",
  },
];

export function QuickGuide() {
  const navigate = useNavigate();
  const [selectedEra, setSelectedEra] = useState<TimePeriod>("visconti");
  const [showChat, setShowChat] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = "";
      
      if (userMessage.toLowerCase().includes("architecture") || userMessage.toLowerCase().includes("gothic")) {
        aiResponse = "The Duomo showcases Italian Gothic architecture at its finest. With 135 spires, over 3,400 statues, and intricate flying buttresses, it represents centuries of architectural evolution. The use of Candoglia marble gives it a distinctive pink-white hue!";
      } else if (userMessage.toLowerCase().includes("visconti") || userMessage.toLowerCase().includes("duke")) {
        aiResponse = "Duke Gian Galeazzo Visconti initiated the Duomo's construction in 1386. The Visconti family saw it as a symbol of their power and Milan's importance. They funded much of the early work and attracted the best architects from across Europe.";
      } else if (userMessage.toLowerCase().includes("statue") || userMessage.toLowerCase().includes("3400")) {
        aiResponse = "The Duomo features over 3,400 statues! Each one tells a story - from biblical figures to saints and historical personalities. The statues were created over centuries by different artists, showcasing evolving artistic styles.";
      } else if (userMessage.toLowerCase().includes("spire") || userMessage.toLowerCase().includes("135")) {
        aiResponse = "The Duomo has 135 spires, each topped with a statue. The tallest spire reaches 108.5 meters and is crowned with the golden Madonnina statue (4.16m tall), Milan's beloved symbol since 1774!";
      } else if (userMessage.toLowerCase().includes("event") || userMessage.toLowerCase().includes("ceremony")) {
        aiResponse = "The Duomo has hosted countless historic events - from the coronation of Napoleon as King of Italy in 1805 to the funerals of Cardinal Carlo Maria Martini. Today it hosts concerts, religious ceremonies, and even fashion shows in the square!";
      } else {
        aiResponse = "That's an interesting question! The Duomo di Milano is a magnificent Gothic cathedral with over 600 years of history. It features 135 spires, over 3,400 statues, and represents Milan's cultural heart. What specific aspect would you like to know more about?";
      }

      setChatMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
    }, 800);
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      const voiceQuestions = [
        "Tell me about the Visconti era",
        "How many spires does the Duomo have?",
        "What about the architecture?",
        "Tell me about the statues"
      ];
      const randomQuestion = voiceQuestions[Math.floor(Math.random() * voiceQuestions.length)];
      setInputMessage(randomQuestion);
      setIsListening(false);
      setTimeout(() => {
        if (randomQuestion) {
          handleSendMessage();
        }
      }, 100);
    }, 2000);
  };

  const handleTopicClick = (topicId: SuggestedTopic) => {
    const topicQuestions: Record<SuggestedTopic, string> = {
      architecture: "Tell me about the Gothic architecture",
      history: "What's the history of the Duomo?",
      events: "What events happened at the Duomo?",
      statues: "Tell me about the 3,400 statues",
    };
    
    setShowChat(true);
    setInputMessage(topicQuestions[topicId]);
    setTimeout(() => handleSendMessage(), 300);
  };

  const handleVoiceGuide = () => {
    alert("Voice guide: 'The Duomo di Milano is a magnificent Gothic cathedral with over 600 years of history...'");
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg">Heritage Quick Guide</h1>
            <p className="text-xs text-stone-500">Explore different historical periods</p>
          </div>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
              showChat ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showChat ? (
            /* AI Chat Section */
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {/* Chat Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-stone-800 to-stone-700 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-base">AI Assistant</h2>
                </div>
                <p className="text-sm text-stone-300">Ask me anything about Piazza Duomo</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Voice Listening Indicator */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <motion.div
                      className="w-3 h-3 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <span className="text-sm text-red-900">Listening for your question...</span>
                  </motion.div>
                )}

                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-stone-400" />
                    </div>
                    <p className="text-stone-600 mb-4">Start a conversation with the AI assistant</p>
                    <div className="space-y-2 w-full">
                      <button
                        onClick={() => {
                          setInputMessage("Tell me about the Visconti era");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="w-full py-2 px-4 bg-white border border-stone-200 rounded-xl text-sm text-left hover:border-stone-300 transition-colors"
                      >
                        Tell me about the Visconti era
                      </button>
                      <button
                        onClick={() => {
                          setInputMessage("How many spires does the Duomo have?");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="w-full py-2 px-4 bg-white border border-stone-200 rounded-xl text-sm text-left hover:border-stone-300 transition-colors"
                      >
                        How many spires does the Duomo have?
                      </button>
                      <button
                        onClick={() => {
                          setInputMessage("Tell me about the architecture");
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="w-full py-2 px-4 bg-white border border-stone-200 rounded-xl text-sm text-left hover:border-stone-300 transition-colors"
                      >
                        Tell me about the architecture
                      </button>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-stone-800 text-white"
                            : "bg-white border border-stone-200 text-stone-800"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleVoiceInput}
                    disabled={isListening}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${
                      isListening ? "bg-red-500 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-3 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-stone-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="w-12 h-12 bg-stone-800 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Time Exploration Section */
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 space-y-4"
            >
              {/* Time Exploration Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-stone-800 to-stone-700 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl">Time Exploration</h2>
                </div>
                <p className="text-sm text-stone-200 leading-relaxed">
                  Select the timeline below to explore different historical periods of the Duomo's construction.
                </p>
              </motion.div>

              {/* Timeline Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(["foundations", "visconti", "sforza", "habsburg"] as TimePeriod[]).map((era) => {
                    const data = timelineData[era];
                    const isSelected = selectedEra === era;
                    
                    return (
                      <button
                        key={era}
                        onClick={() => setSelectedEra(era)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? `${data.borderColor} ${data.bgColor}`
                            : "border-stone-200 bg-stone-50 hover:border-stone-300"
                        }`}
                      >
                        <p className={`text-sm whitespace-nowrap ${isSelected ? data.color : "text-stone-600"}`}>
                          {data.title}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">{data.years}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Selected Era Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedEra}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl border-2 ${timelineData[selectedEra].borderColor} ${timelineData[selectedEra].bgColor} p-6`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl">
                      🏛️
                    </div>
                    <div>
                      <h3 className={`text-lg ${timelineData[selectedEra].color}`}>
                        {timelineData[selectedEra].title}
                      </h3>
                      <p className="text-xs text-stone-500">{timelineData[selectedEra].years}</p>
                    </div>
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed mb-4">
                    {timelineData[selectedEra].content}
                  </p>

                  <div>
                    <p className="text-xs text-stone-500 mb-2">Key Highlights:</p>
                    <div className="space-y-2">
                      {timelineData[selectedEra].highlights.map((highlight, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full bg-white border-2 ${timelineData[selectedEra].borderColor} mt-1.5 flex-shrink-0`} />
                          <p className="text-sm text-stone-700 leading-relaxed">{highlight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Smart Suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="bg-white rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base">Smart Suggestions</h3>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-stone-500 hover:text-stone-700"
                  >
                    {showSuggestions ? "Hide" : "Show all"}
                  </button>
                </div>

                <p className="text-sm text-stone-600 mb-4">
                  Based on your reading, you might want to explore these topics:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {topicSuggestions.map((topic, index) => {
                    const Icon = topic.icon;
                    return (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        onClick={() => handleTopicClick(topic.id)}
                        className={`${topic.bgColor} rounded-xl p-4 text-left hover:shadow-md transition-all active:scale-95`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3`}>
                          <Icon className={`w-5 h-5 ${topic.color}`} />
                        </div>
                        <p className={`text-sm mb-1 ${topic.color}`}>{topic.title}</p>
                        {showSuggestions && (
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {topic.description}
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Voice Guide Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-2"
              >
                <button 
                  onClick={handleVoiceGuide}
                  className="w-full py-4 bg-white border border-stone-200 text-stone-800 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="text-base">Play Voice Guide</span>
                </button>
              </motion.div>

              {/* Chat Hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-center py-4"
              >
                <p className="text-xs text-stone-500 mb-2">Have more questions?</p>
                <button
                  onClick={() => setShowChat(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-full text-sm active:scale-95 transition-transform"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with AI Assistant
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
