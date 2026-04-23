import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

export function QuizFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCorrect, explanation, questionIndex, totalQuestions, answers } = location.state || {};

  useEffect(() => {
    // Scroll to top when feedback is shown
    window.scrollTo(0, 0);
  }, []);

  const handleNext = () => {
    if (questionIndex < totalQuestions - 1) {
      // Go back to treasure hunt with next question
      navigate("/treasure-hunt", {
        state: { currentIndex: questionIndex + 1, answers },
      });
    } else {
      // Go to summary
      navigate("/summary", {
        state: { answers, completedQuiz: true },
      });
    }
  };

  if (!location.state) {
    navigate("/treasure-hunt");
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="w-full max-w-sm"
      >
        {/* Feedback Icon */}
        <div className="flex justify-center mb-6">
          {isCorrect ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-16 h-16 text-emerald-600" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center"
            >
              <XCircle className="w-16 h-16 text-red-600" />
            </motion.div>
          )}
        </div>

        {/* Feedback Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl mb-2">
            {isCorrect ? "Correct!" : "Not quite"}
          </h1>
          <p className="text-base text-stone-600">
            {isCorrect
              ? "Great job! You know your heritage."
              : "Don't worry, let's learn together."}
          </p>
        </motion.div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-8"
        >
          <h2 className="text-base mb-3">Did you know?</h2>
          <p className="text-sm text-stone-700 leading-relaxed">{explanation}</p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-stone-500">
            Question {questionIndex + 1} of {totalQuestions}
          </p>
          <div className="flex gap-2 justify-center mt-3">
            {Array.from({ length: totalQuestions }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < answers.length
                    ? answers[index]
                      ? "bg-emerald-500"
                      : "bg-red-500"
                    : index === questionIndex
                    ? "bg-stone-800"
                    : "bg-stone-300"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={handleNext}
          className="w-full py-4 bg-stone-800 text-white rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span>
            {questionIndex < totalQuestions - 1 ? "Next Question" : "See Results"}
          </span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        {/* Motivational Message */}
        {isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-emerald-700">
              🎉 Keep up the great work!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
