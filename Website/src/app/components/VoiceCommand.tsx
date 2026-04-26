import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, X, CheckCircle, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";

interface VoiceCommandProps {
  onClose: () => void;
  onCommand: (command: string) => void;
}

export function VoiceCommand({ onClose, onCommand }: VoiceCommandProps) {
  const [transcript, setTranscript] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedCommand, setConfirmedCommand] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { transcript: voiceTranscript, listening, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  // Handle voice transcript changes
  useEffect(() => {
    if (voiceTranscript && !showConfirmation) {
      setTranscript(voiceTranscript);
      processVoiceInput(voiceTranscript);
    }
  }, [voiceTranscript]);

  // Process voice input and send to chat API
  const processVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    stopSpeaking(); // Stop any previous speech

    try {
      const res = await sendMessage(text);
      const reply = res.answer || res.reply || "I understand your request. Let me take you there!";
      
      setAiResponse(reply);
      speak(reply); // 🔥 AI speaks back
      
      // Show confirmation after AI responds
      setConfirmedCommand(reply);
      setShowConfirmation(true);
    } catch (err) {
      const fallbackReply = "I've received your request. Let me take you to that location!";
      setAiResponse(fallbackReply);
      speak(fallbackReply);
      setConfirmedCommand(fallbackReply);
      setShowConfirmation(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    onCommand(transcript.toLowerCase().includes("duomo") ? "duomo medieval" : "explore");
    stopSpeaking();
  };

  const handleRetry = () => {
    setTranscript("");
    setShowConfirmation(false);
    setConfirmedCommand("");
    setAiResponse("");
    resetTranscript();
  };

  const handleHoldStart = () => {
    stopSpeaking();
    startListening();
  };

  const handleHoldEnd = () => {
    stopListening();
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
        {listening && (
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

        {/* Processing State */}
        {isProcessing && !listening && (
          <div className="flex flex-col items-center py-8">
            <motion.div
              className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-base text-stone-800 mb-2">Processing...</p>
            <p className="text-sm text-stone-500 text-center max-w-xs">
              Connecting to AI assistant
            </p>
          </div>
        )}

        {/* Hold to Talk Button */}
        {!listening && !isProcessing && !transcript && !showConfirmation && (
          <div className="flex flex-col items-center py-8">
            <button
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              className="w-32 h-32 bg-red-500 rounded-full flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Mic className="w-12 h-12 text-white mb-1" />
              <span className="text-white text-sm font-medium">Hold to Talk</span>
            </button>
            <p className="text-sm text-stone-500 text-center max-w-xs mt-4">
              Press and hold the microphone button, then speak your command
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
