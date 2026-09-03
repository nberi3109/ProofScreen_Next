"use client";

import { Mic, Square, Waves } from "lucide-react";
import { useEffect, useState } from "react";

function formatDuration(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function VoiceRecorder({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const toggleRecording = () => {
    if (!recording) {
      setRecording(true);
      return;
    }
    setRecording(false);
    onComplete();
  };

  return (
    <div className="recorder">
      <button
        className={`mic-button ${recording ? "recording" : ""}`}
        onClick={toggleRecording}
        aria-label={recording ? "Stop recording" : "Record answer"}
      >
        {recording ? (
          <Square size={22} fill="currentColor" />
        ) : (
          <Mic size={26} />
        )}
      </button>

      {recording ? (
        <>
          <div className="wave">
            <Waves size={34} />
            <span>{formatDuration(seconds)}</span>
          </div>
          <p>
            <i /> Recording... Tap to stop
          </p>
        </>
      ) : (
        <p>Tap to record your answer</p>
      )}
    </div>
  );
}
