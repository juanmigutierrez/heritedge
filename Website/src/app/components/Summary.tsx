import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Home, RotateCcw, Trophy, CheckCircle, XCircle } from "lucide-react";

const landmarks = [
  { id: "duomo", name: "Duomo di Milano", icon: "⛪" },
  { id: "galleria", name: "Galleria Vittorio Emanuele II", icon: "🏛️" },
  { id: "palazzo", name: "Palazzo Reale", icon: "🏰" },
];

const timePeriods = [
  { id: "medieval", name: "Medieval Period" },
  { id: "postwar", name: "After War (1950s)" },
  { id: "present", name: "Present Day" },
];

export function Summary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { answers, completedQuiz, visitedLandmarks = [], exploredPeriods = [] } = location.state || {};

  const correctAnswers = answers ? answers.filter((a: boolean) => a).length : 0;
  const totalQuestions = answers ? answers.length : 0;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 px-6 pt-12 pb-16 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-2xl mb-2">Exploration Complete!</h1>
          <p className="text-base opacity-90">
            Here's what you discovered at Piazza Duomo
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 pb-8">
        {/* Quiz Results */}
        {completedQuiz && answers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm mb-4"
          >
            <h2 className="text-lg mb-4">Quiz Results</h2>

            {/* Score Circle */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 352 }}
                    animate={{ strokeDashoffset: 352 - (352 * scorePercentage) / 100 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    style={{ strokeDasharray: 352 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl">{scorePercentage}%</span>
                  <span className="text-xs text-stone-500">Score</span>
                </div>
              </div>
            </div>

            {/* Answer Breakdown */}
            <div className="space-y-2">
              {answers.map((isCorrect: boolean, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-stone-50 rounded-xl"
                >
                  <span className="text-sm text-stone-700">Question {index + 1}</span>
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-stone-200 text-center">
              <p className="text-sm text-stone-600">
                You answered {correctAnswers} out of {totalQuestions} questions correctly!
              </p>
            </div>
          </motion.div>
        )}

        {/* Visited Landmarks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-4"
        >
          <h2 className="text-lg mb-4">Landmarks Explored</h2>
          <div className="space-y-3">
            {landmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="flex items-center gap-3 py-2 px-3 bg-stone-50 rounded-xl"
              >
                <span className="text-2xl">{landmark.icon}</span>
                <span className="text-sm text-stone-700 flex-1">{landmark.name}</span>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Time Periods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <h2 className="text-lg mb-4">Time Periods Explored</h2>
          <div className="space-y-2">
            {timePeriods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between py-2 px-3 bg-stone-50 rounded-xl"
              >
                <span className="text-sm text-stone-700">{period.name}</span>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6"
        >
          <p className="text-base text-amber-900 text-center">
            🎉 You've journeyed through centuries of history at Piazza Duomo. Keep exploring to learn more!
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate("/treasure-hunt")}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Take Quiz Again</span>
          </button>

          <button
            onClick={() => navigate("/ar-overview")}
            className="w-full py-4 bg-stone-800 text-white rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <span>Continue AR Experience</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full py-4 bg-white border border-stone-200 text-stone-800 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Home className="w-5 h-5" />
            <span>Return Home</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
