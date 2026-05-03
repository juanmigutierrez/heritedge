import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Camera, Check, Info, Sparkles, MapPin, Trophy, X, ZoomIn } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import knowledgeBase from "@/content/knowledge-base.json";

interface Challenge {
  id: number;
  title: string;
  description: string;
  type: "question" | "photo" | "ar-explore";
  question?: string;
  options?: string[];
  correctAnswer?: number;
  photoPrompt?: string;
  arHint: string;
  location: string;
  points: number;
  arHotspots?: ARHotspot[];
}

interface ARHotspot {
  id: string;
  title: string;
  x: number; // percentage position
  y: number;
  info: string;
  image?: string;
  discovered: boolean;
}

// Mapping from hotspot IDs to KB fact IDs
const hotspotToFactMapping: Record<string, string> = {
  spire1: "duomo-madonnina",
  spire2: "duomo-spires-medieval",
  spire3: "duomo-statues-count",
  galleria1: "galleria-glass-dome",
  galleria2: "galleria-mengoni-1865",
  portal1: "duomo-1386-foundation",
  portal2: "duomo-spires-medieval",
};

// Helper to find KB fact for a hotspot
function getSourceForHotspot(hotspotId: string) {
  const factId = hotspotToFactMapping[hotspotId];
  if (!factId) return null;
  const fact = knowledgeBase.facts.find(f => f.id === factId);
  return fact?.source || null;
}

const challenges: Challenge[] = [
  {
    id: 1,
    title: "Discover the Spires",
    description: "Use AR to explore and count the Gothic spires",
    type: "ar-explore",
    arHint: "Point your camera at the Duomo to reveal AR hotspots on the spires",
    location: "Duomo Cathedral",
    points: 150,
    arHotspots: [
      {
        id: "spire1",
        title: "Main Spire",
        x: 50,
        y: 15,
        info: "The tallest spire reaches 108.5 meters, crowned with the golden Madonnina statue - the symbol of Milan.",
        image: "https://images.unsplash.com/photo-1688674966559-fe9f9d661c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW9tbyUyMG1pbGFubyUyMGNhdGhlZHJhbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDcyMjkzNnww&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
      {
        id: "spire2",
        title: "Gothic Pinnacles",
        x: 30,
        y: 25,
        info: "Each of the 135 spires is topped with a statue. These Gothic pinnacles took centuries to complete.",
        image: "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
      {
        id: "spire3",
        title: "Statue Details",
        x: 70,
        y: 30,
        info: "Over 3,400 statues decorate the cathedral. Each one tells a story from religious history.",
        image: "https://images.unsplash.com/photo-1620030537215-9ef4d9c0d3ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWxhenpvJTIwcmVhbGUlMjBtaWxhbm8lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0NzIyOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
    ],
  },
  {
    id: 2,
    title: "Medieval Foundation",
    description: "Capture evidence of the medieval architecture",
    type: "photo",
    photoPrompt: "Take a photo of any Gothic architectural element (arches, spires, or statues)",
    arHint: "Use AR view to highlight Gothic details on the cathedral",
    location: "Duomo Exterior",
    points: 100,
  },
  {
    id: 3,
    title: "Explore the Entrance",
    description: "Discover AR information about the main entrance",
    type: "ar-explore",
    arHint: "Point at the cathedral entrance to reveal historical AR layers",
    location: "Duomo Main Portal",
    points: 150,
    arHotspots: [
      {
        id: "portal1",
        title: "Bronze Doors",
        x: 50,
        y: 50,
        info: "The massive bronze doors were completed in 1965, depicting scenes from the life of the Virgin Mary.",
        image: "https://images.unsplash.com/photo-1688674966559-fe9f9d661c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW9tbyUyMG1pbGFubyUyMGNhdGhlZHJhbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDcyMjkzNnww&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
      {
        id: "portal2",
        title: "Gothic Arches",
        x: 35,
        y: 60,
        info: "The pointed Gothic arches showcase medieval engineering mastery from the 14th century.",
        image: "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
    ],
  },
  {
    id: 4,
    title: "The Construction Timeline",
    description: "Answer the question about the Duomo's history",
    type: "question",
    question: "When did construction of the Duomo begin according to the Medieval period section?",
    options: ["1286", "1386", "1486", "1586"],
    correctAnswer: 1,
    arHint: "Point at the foundation stones to see AR timeline overlay",
    location: "Duomo Base",
    points: 100,
  },
  {
    id: 5,
    title: "Galleria Connection",
    description: "Explore the famous Galleria in AR",
    type: "ar-explore",
    arHint: "Navigate to Galleria Vittorio Emanuele II entrance",
    location: "Galleria Entrance",
    points: 150,
    arHotspots: [
      {
        id: "galleria1",
        title: "Glass Dome",
        x: 50,
        y: 20,
        info: "The iron and glass dome was revolutionary for its time in 1877, one of the first shopping arcades in the world.",
        image: "https://images.unsplash.com/photo-1671232847170-b31a815afcf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYWxsZXJpYSUyMHZpdHRvcmlvJTIwZW1hbnVlbGUlMjBtaWxhbm98ZW58MXx8fHwxNzc0NzIyOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
      {
        id: "galleria2",
        title: "Mosaic Floor",
        x: 50,
        y: 70,
        info: "The mosaic floor features the emblems of the four major Italian cities: Milan, Turin, Florence, and Rome.",
        image: "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
        discovered: false,
      },
    ],
  },
];

export function TreasureHunt() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [arMode, setArMode] = useState(false);
  const [hotspots, setHotspots] = useState<ARHotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<ARHotspot | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  const currentChallenge = challenges[currentChallengeIndex];
  const progress = (completedChallenges.length / challenges.length) * 100;
  const requiredDiscoveries = currentChallenge.arHotspots?.length || 0;

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnterAR = () => {
    setArMode(true);
    if (currentChallenge.arHotspots) {
      setHotspots(currentChallenge.arHotspots.map(h => ({ ...h, discovered: false })));
      setDiscoveredCount(0);
    }
  };

  const handleExitAR = () => {
    setArMode(false);
    setSelectedHotspot(null);
  };

  const handleHotspotClick = (hotspot: ARHotspot) => {
    if (!hotspot.discovered) {
      const updatedHotspots = hotspots.map(h =>
        h.id === hotspot.id ? { ...h, discovered: true } : h
      );
      setHotspots(updatedHotspots);
      setDiscoveredCount(prev => prev + 1);
    }
    setSelectedHotspot(hotspot);
  };

  const handleSubmit = () => {
    if (currentChallenge.type === "question" && selectedAnswer === null) return;
    if (currentChallenge.type === "photo" && !uploadedPhoto) return;
    if (currentChallenge.type === "ar-explore" && discoveredCount < requiredDiscoveries) return;

    let correct = false;
    
    if (currentChallenge.type === "question") {
      correct = selectedAnswer === currentChallenge.correctAnswer;
    } else {
      correct = true;
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setTotalScore(totalScore + currentChallenge.points);
      setCompletedChallenges([...completedChallenges, currentChallenge.id]);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setUploadedPhoto(null);
    setArMode(false);
    setHotspots([]);
    setSelectedHotspot(null);
    setDiscoveredCount(0);

    if (currentChallengeIndex < challenges.length - 1) {
      setCurrentChallengeIndex(currentChallengeIndex + 1);
    } else {
      navigate("/summary", {
        state: {
          score: totalScore + (isCorrect ? currentChallenge.points : 0),
          totalChallenges: challenges.length,
          completed: completedChallenges.length + (isCorrect ? 1 : 0),
          treasureHunt: true,
        },
      });
    }
  };

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
            <h1 className="text-lg">AR Treasure Hunt</h1>
            <p className="text-xs text-emerald-50">
              Challenge {currentChallengeIndex + 1} of {challenges.length}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{totalScore}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showFeedback ? (
            /* Feedback Screen */
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                  isCorrect
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {isCorrect ? (
                  <Check className="w-12 h-12" />
                ) : (
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </motion.div>

              <h2 className="text-2xl mb-2">
                {isCorrect ? "Excellent Discovery!" : "Not quite right"}
              </h2>
              
              <p className="text-stone-600 mb-2">
                {isCorrect
                  ? `You earned ${currentChallenge.points} points!`
                  : "Keep exploring!"}
              </p>

              {currentChallenge.type === "ar-explore" && isCorrect && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 max-w-sm">
                  <p className="text-sm text-blue-900">
                    You discovered all {requiredDiscoveries} AR hotspots! Great exploration skills.
                  </p>
                </div>
              )}

              <button
                onClick={handleNext}
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl active:scale-95 transition-transform"
              >
                {currentChallengeIndex < challenges.length - 1 ? "Next Challenge" : "View Results"}
              </button>
            </motion.div>
          ) : arMode && currentChallenge.type === "ar-explore" ? (
            /* AR View */
            <motion.div
              key="ar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full bg-stone-900"
            >
              {/* AR Camera Feed */}
              <div className="relative h-full">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1688674966559-fe9f9d661c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW9tbyUyMG1pbGFubyUyMGNhdGhlZHJhbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDcyMjkzNnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="AR View"
                  className="w-full h-full object-cover"
                />

                {/* AR Overlay Grid */}
                <div className="absolute inset-0">
                  {/* Corner Markers */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-emerald-400" />

                  {/* Scanning Line Animation */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  />
                </div>

                {/* AR Hotspots */}
                {hotspots.map((hotspot) => (
                  <motion.button
                    key={hotspot.id}
                    onClick={() => handleHotspotClick(hotspot)}
                    className="absolute"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <div className="relative">
                      {/* Pulse Animation */}
                      <motion.div
                        className={`absolute inset-0 rounded-full ${
                          hotspot.discovered ? "bg-emerald-400/30" : "bg-blue-400/30"
                        }`}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                      
                      {/* Hotspot Marker */}
                      <div
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border-2 ${
                          hotspot.discovered
                            ? "bg-emerald-500/90 border-emerald-300"
                            : "bg-blue-500/90 border-blue-300"
                        }`}
                      >
                        {hotspot.discovered ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Info className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* Hotspot Label */}
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                        {hotspot.title}
                      </div>
                    </div>
                  </motion.button>
                ))}

                {/* AR Status HUD */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm">AR Active</span>
                      </div>
                      <button
                        onClick={handleExitAR}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${(discoveredCount / requiredDiscoveries) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-xs text-emerald-400">
                        {discoveredCount}/{requiredDiscoveries}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Help Hint */}
                {discoveredCount === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-24 left-4 right-4 bg-blue-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-2xl text-center"
                  >
                    <p className="text-sm">👆 Tap the glowing markers to discover AR information</p>
                  </motion.div>
                )}

                {/* Complete Button */}
                {discoveredCount === requiredDiscoveries && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-6 left-6 right-6"
                  >
                    <button
                      onClick={handleSubmit}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Complete Challenge
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Hotspot Detail Modal */}
              <AnimatePresence>
                {selectedHotspot && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-end"
                    onClick={() => setSelectedHotspot(null)}
                  >
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
                    >
                      <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4" />
                      
                      {selectedHotspot.image && (
                        <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[16/10]">
                          <ImageWithFallback
                            src={selectedHotspot.image}
                            alt={selectedHotspot.title}
                            className="w-full h-full object-cover"
                          />
                          {selectedHotspot.discovered && (
                            <div className="absolute top-3 right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Info className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg mb-1">{selectedHotspot.title}</h3>
                          <p className="text-sm text-stone-600 leading-relaxed">
                            {selectedHotspot.info}
                          </p>
                        </div>
                      </div>

                      {getSourceForHotspot(selectedHotspot.id) && (
                        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                          <p className="font-semibold mb-1">📚 Source:</p>
                          <a 
                            href={getSourceForHotspot(selectedHotspot.id)?.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-amber-700 underline hover:text-amber-800"
                          >
                            {getSourceForHotspot(selectedHotspot.id)?.label}
                          </a>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedHotspot(null)}
                        className="w-full py-3 bg-stone-100 text-stone-800 rounded-2xl active:scale-95 transition-transform"
                      >
                        Close
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Challenge Screen */
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 space-y-4"
            >
              {/* Challenge Header */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    {currentChallenge.type === "ar-explore" ? "🎯" : currentChallenge.type === "question" ? "❓" : "📷"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg mb-1">{currentChallenge.title}</h2>
                    <p className="text-sm text-stone-600">{currentChallenge.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{currentChallenge.location}</span>
                  <span className="ml-auto text-emerald-600">+{currentChallenge.points} pts</span>
                </div>
              </div>

              {/* AR Hint */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">AR Hint:</span> {currentChallenge.arHint}
                    </p>
                  </div>
                </div>
                {currentChallenge.type === "ar-explore" && (
                  <button
                    onClick={handleEnterAR}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Enter AR Experience
                  </button>
                )}
              </div>

              {/* Question Type */}
              {currentChallenge.type === "question" && (
                <div className="space-y-3">
                  <div className="bg-stone-800 text-white rounded-2xl p-4">
                    <p className="text-sm leading-relaxed">{currentChallenge.question}</p>
                  </div>

                  {currentChallenge.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        selectedAnswer === index
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedAnswer === index
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-stone-300"
                          }`}
                        >
                          {selectedAnswer === index && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-stone-800">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Photo Type */}
              {currentChallenge.type === "photo" && (
                <div className="space-y-3">
                  <div className="bg-stone-800 text-white rounded-2xl p-4">
                    <p className="text-sm leading-relaxed">{currentChallenge.photoPrompt}</p>
                  </div>

                  {uploadedPhoto ? (
                    <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-[4/3]">
                      <img
                        src={uploadedPhoto}
                        alt="Uploaded"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                      <button
                        onClick={() => setUploadedPhoto(null)}
                        className="absolute bottom-3 left-3 right-3 py-2 bg-white/90 backdrop-blur-sm text-stone-800 rounded-xl text-sm active:scale-95 transition-transform"
                      >
                        Take Another Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[4/3] border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                      >
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="text-center px-6">
                          <p className="text-base text-stone-800 mb-1">Take Photo</p>
                          <p className="text-xs text-stone-500">Tap to open camera</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AR Explore Type */}
              {currentChallenge.type === "ar-explore" && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ZoomIn className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base text-emerald-900">AR Exploration Required</h3>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed mb-3">
                      Enter AR mode and discover all {requiredDiscoveries} interactive hotspots to complete this challenge.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-600">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Undiscovered</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Discovered</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tip */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm text-amber-900">
                  💡 <span className="font-medium">Tip:</span> Review the Quick Guide if you need help with the questions!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button - Only for non-AR challenges */}
      {!showFeedback && !arMode && (
        <div className="sticky bottom-0 bg-white border-t border-stone-200 px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={
              (currentChallenge.type === "question" && selectedAnswer === null) ||
              (currentChallenge.type === "photo" && !uploadedPhoto) ||
              (currentChallenge.type === "ar-explore" && discoveredCount < requiredDiscoveries)
            }
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            Submit {currentChallenge.type === "question" ? "Answer" : currentChallenge.type === "photo" ? "Photo" : "AR Discovery"}
          </button>
        </div>
      )}
    </div>
  );
}
