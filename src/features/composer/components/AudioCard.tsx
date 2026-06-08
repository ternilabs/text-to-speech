import { useEffect, useRef, useState } from "preact/hooks";
import { Download, Pause, Play } from "preact-feather";
import type { SingleAudioResult } from "../../tts/signals";

type AudioCardProps = {
  result: SingleAudioResult;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
};

export function AudioCard({ result }: AudioCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, [result.url]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const formatTag = result.format === "wav"
    ? "WAV · 44.1 kHz · 16-bit"
    : "MP3 · 128 kbps";

  return (
    <section className="audio-card" aria-label="Generated audio">
      <audio
        ref={audioRef}
        src={result.url}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration((event.currentTarget as HTMLAudioElement).duration);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime((event.currentTarget as HTMLAudioElement).currentTime);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div className="audio-header">
        <div className="status-dot" />
        Audio ready.
      </div>

      <div className="player-row">
        <button
          type="button"
          className={`play-btn${isPlaying ? " playing" : ""}`}
          aria-label={isPlaying ? "Pause generated audio" : "Play generated audio"}
          onClick={() => void togglePlayback()}
        >
          <Play className="pi-play" size={13} />
          <Pause className="pi-pause" size={13} />
        </button>

        <div className="track-info">
          <div className="track-name">{result.filename}</div>
          <div className="track-meta">
            Kokoro · {result.format.toUpperCase()} · {result.voice} · {result.device.toUpperCase()} · {result.speed.toFixed(2)}x
          </div>
        </div>

        <div className="timer">{formatTime(currentTime)} / {formatTime(duration)}</div>
      </div>

      <div
        className="audio-progress-track"
        onClick={(event) => {
          const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
          const pct = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          seek(pct * duration);
        }}
      >
        <div className="audio-progress-fill" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }} />
      </div>

      <div className="audio-foot">
        <span className="format-tag">{formatTag}</span>
        <a className="btn-dl" href={result.url} download={result.filename} aria-label="Download generated audio">
          <Download size={12} strokeWidth={1.6} />
          Download
        </a>
      </div>
    </section>
  );
}
