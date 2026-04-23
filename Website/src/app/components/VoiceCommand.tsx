import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, X, CheckCircle } from "lucide-react";

interface VoiceCommandProps {
  onClose: () => void;
  onCommand: (command: string) => void;
}

export function VoiceCommand({ onClose, onCommand }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedCommand, setConfirmedCommand] = useState("");

  useEffect(() => {
    // Simulate voice recognition
    if (isListening) {
      const timer = setTimeout(() => {
        const simulatedCommand = "Take me to Duomo in medieval times";
        setTranscript(simulatedCommand);
        setIsListening(false);
        
        // Show confirmation
        setTimeout(() => {
          setConfirmedCommand("Did you mean Duomo in the 15th century?");
          setShowConfirmation(true);
        }, 500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const handleConfirm = () => {
    onCommand("duomo medieval");
  };

  const handleRetry = () => {
    setTranscript("");
    setShowConfirmation(false);
    setIsListening(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-end z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full bg-white rounded-t-3xl px-6 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Voice Command</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listening Animation */}
        {isListening && (
          <div className="flex flex-col items-center py-8">
            <motion.div
              className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Mic className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-base text-stone-800 mb-2">Listening...</p>
            <p className="text-sm text-stone-500 text-center max-w-xs">
              Try saying: "Take me to Duomo in medieval times"
            </p>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && !showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6"
          >
            <div className="flex items-start gap-3 bg-stone-100 rounded-2xl p-4">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-stone-500 mb-1">You said:</p>
                <p className="text-base text-stone-800">{transcript}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirmation */}
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4"
          >
            <div className="bg-blue-50 rounded-2xl p-5 mb-4">
              <p className="text-sm text-blue-900">{confirmedCommand}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-3 bg-white border border-stone-200 text-stone-800 rounded-2xl active:scale-95 transition-transform"
              >
                No, retry
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-stone-800 text-white rounded-2xl active:scale-95 transition-transform"
              >
                Yes, confirm
              </button>
            </div>
          </motion.div>
        )}

        {/* Example Commands */}
        <div className="mt-6 pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-500 mb-3">Example commands:</p>
          <div className="space-y-2 text-sm text-stone-600">
            <p>• "Take me to Duomo"</p>
            <p>• "Show me Galleria in medieval times"</p>
            <p>• "Go to Palazzo present day"</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
