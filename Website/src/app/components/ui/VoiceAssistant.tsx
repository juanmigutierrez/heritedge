import { useSpeechRecognition } from "@/features/voice/useSpeechRecognition";
import { sendMessage, speak, stopSpeaking } from "@/services/chatService";
import { useState, useEffect } from "react";

const VoiceAssistant = () => {
  const { transcript, listening, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const [response, setResponse] = useState("");

  useEffect(() => {
    if (!transcript) return;

    const fetchResponse = async () => {
      try {
        const res = await sendMessage(transcript);
        const reply = res.answer || res.reply || "No response";

        setResponse(reply);
        speak(reply); // 🔥 AI speaks back
      } catch (err) {
        setResponse("Error connecting to AI");
      }
    };

    fetchResponse();
  }, [transcript]);

  const handleHoldStart = () => {
    stopSpeaking();
    startListening();
  };

  const handleHoldEnd = () => {
    stopListening();
  };

  return (
    <div>
      <button
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
      >
        🎤 Hold to Talk
      </button>

      <p><b>You:</b> {transcript}</p>
      <p><b>AI:</b> {response}</p>
    </div>
  );
};

export default VoiceAssistant;