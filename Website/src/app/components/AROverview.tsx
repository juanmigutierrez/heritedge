import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic, HelpCircle, Clock } from "lucide-react";
import { VoiceCommand } from "./VoiceCommand";
import { TimePeriodSelector } from "./TimePeriodSelector";

type TimePeriod = "medieval" | "postwar" | "present";
type Landmark = "duomo" | "galleria" | "palazzo";

interface LandmarkPosition {
  id: Landmark;
  name: string;
  x: number;
  y: number;
}

const landmarks: LandmarkPosition[] = [
  { id: "duomo", name: "Duomo", x: 50, y: 45 },
  { id: "galleria", name: "Galleria", x: 30, y: 55 },
  { id: "palazzo", name: "Palazzo", x: 70, y: 50 },
];

export function AROverview() {
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("present");
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [showVoiceCommand, setShowVoiceCommand] = useState(false);
  const [showTimePeriodSelector, setShowTimePeriodSelector] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleLandmarkClick = (landmarkId: Landmark) => {
    setSelectedLandmark(landmarkId);
    // Navigate after a brief moment
    setTimeout(() => {
      navigate(`/ar-artifact/${landmarkId}?period=${timePeriod}`);
    }, 300);
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    setShowTimePeriodSelector(false);
  };

  const handleVoiceCommand = (command: string) => {
    // Parse voice commands like "Take me to Duomo in medieval times"
    const landmarkMatch = command.toLowerCase().match(/duomo|galleria|palazzo/);
    const periodMatch = command.toLowerCase().match(/medieval|war|present/);
    
    if (landmarkMatch) {
      const landmark = landmarkMatch[0] as Landmark;
      if (periodMatch) {
        const period = periodMatch[0].includes("war") ? "postwar" : periodMatch[0] as TimePeriod;
        setTimePeriod(period);
      }
      handleLandmarkClick(landmark);
    }
    
    setShowVoiceCommand(false);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Simulated AR Camera View */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-900">
        {/* Grid overlay for AR effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-12 h-full w-full">
            {Array.from({ length: 96 }).map((_, i) => (
              <div key={i} className="border border-blue-400" />
            ))}
          </div>
        </div>

        {/* AR Surface with Landmarks */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-sm aspect-square"
          >
            {/* AR Platform */}
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/30 bg-blue-400/5 backdrop-blur-sm">
              {/* Period Indicator */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs rounded-full">
                {timePeriod === "medieval" && "Medieval Period"}
                {timePeriod === "postwar" && "After War (1950s)"}
                {timePeriod === "present" && "Present Day"}
              </div>

              {/* Landmarks */}
              {landmarks.map((landmark) => (
                <motion.button
                  key={landmark.id}
                  onClick={() => handleLandmarkClick(landmark.id)}
                  className={`absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                    selectedLandmark === landmark.id
                      ? "bg-blue-500 border-blue-300 scale-110"
                      : "bg-white/10 border-blue-400 hover:bg-white/20"
                  }`}
                  style={{
                    left: `${landmark.x}%`,
                    top: `${landmark.y}%`,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl mb-1">
                    {landmark.id === "duomo" && "⛪"}
                    {landmark.id === "galleria" && "🏛️"}
                    {landmark.id === "palazzo" && "🏰"}
                  </span>
                  <span className="text-white text-xs">{landmark.name}</span>
                </motion.button>
              ))}

              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1="30%"
                  y1="55%"
                  x2="50%"
                  y2="45%"
                  stroke="#60a5fa"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <line
                  x1="50%"
                  y1="45%"
                  x2="70%"
                  y2="50%"
                  stroke="#60a5fa"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 px-6 py-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm">AR Active</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Landmark & Time Period */}
        <div className="mt-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-2xl inline-block">
          <p className="text-white text-xs opacity-75">Viewing</p>
          <p className="text-white text-sm">
            {selectedLandmark ? `${selectedLandmark} - ${timePeriod}` : "Piazza Duomo"}
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setShowTimePeriodSelector(true)}
            className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs">Period</span>
          </button>

          <button
            onClick={() => setShowVoiceCommand(true)}
            className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-xs">Voice</span>
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="flex flex-col items-center gap-1 text-white active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <span className="text-xs">Help</span>
          </button>
        </div>
      </div>

      {/* Voice Command Modal */}
      <AnimatePresence>
        {showVoiceCommand && (
          <VoiceCommand
            onClose={() => setShowVoiceCommand(false)}
            onCommand={handleVoiceCommand}
          />
        )}
      </AnimatePresence>

      {/* Time Period Selector Modal */}
      <AnimatePresence>
        {showTimePeriodSelector && (
          <TimePeriodSelector
            currentPeriod={timePeriod}
            onSelect={handleTimePeriodChange}
            onClose={() => setShowTimePeriodSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center px-6 z-50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl mb-4">AR Experience Help</h2>
              <div className="space-y-3 text-sm text-stone-700">
                <p>• Tap on any landmark to explore it in detail</p>
                <p>• Use the Period button to change time periods</p>
                <p>• Try voice commands like "Show me Duomo in medieval times"</p>
                <p>• Move your device slowly for best AR tracking</p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-6 py-3 bg-stone-800 text-white rounded-2xl active:scale-95 transition-transform"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
