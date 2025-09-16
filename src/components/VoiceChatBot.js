import React, { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

export default function VoiceChatbot({ onCommand }) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    // Whenever speech recognition finalizes a transcript, send it to parent (for processing)
    if (!listening && transcript.trim()) {
      onCommand(transcript.trim());
      resetTranscript();
    }
  }, [listening, transcript, onCommand, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser does not support speech recognition.</span>;
  }

  return (
    <div style={{ background: "#fff6", borderRadius: 8, padding: 12, margin: 16 }}>
      <button
        onClick={() => SpeechRecognition.startListening({ continuous: false, language: "en-IN" })}
        disabled={listening}
        style={{ fontWeight: 700, fontSize: 16, padding: "8px 14px", borderRadius: 6, background: "#3f72af", color: "#fff" }}
      >
        🎤 {listening ? "Listening..." : "Start Voice"}
      </button>
      <span style={{ marginLeft: 12 }}>{listening ? "Speak your command..." : transcript ? `Heard: "${transcript}"` : ""}</span>
    </div>
  );
}
