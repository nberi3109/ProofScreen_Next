"use client";

import { Mic, Square, Waves } from "lucide-react";
import { useEffect, useState } from "react";

function formatDuration(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * A duration timer, not a recorder.
 *
 * Nothing here touches the microphone: real voice answers arrive as WhatsApp
 * media IDs and are transcribed server-side, so there is no browser audio path
 * to build. What this does produce is an honest elapsed time, which is what
 * the backend's `audio_seconds` field wants — it feeds the voice-effort signal
 * (duration and word count only; accent, fluency and pause pattern are never
 * measured, because they are proxies for region and class).
 *
 * The copy says "timer" for that reason. A mic button that implies recording
 * and captures nothing is the kind of demo detail that becomes a bug report.
 */
export default function VoiceRecorder({
  onComplete,
}: {
  onComplete: (seconds: number) => void;
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
    onComplete(seconds);
  };

  return (
    <div className="recorder">
      <button
        className={`mic-button ${recording ? "recording" : ""}`}
        onClick={toggleRecording}
        aria-label={recording ? "Stop timing this answer" : "Start timing this answer"}
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
            <i /> Timing your answer... Tap to stop
          </p>
        </>
      ) : (
        <p>Tap to time your answer, then type it below</p>
      )}
    </div>
  );
}
