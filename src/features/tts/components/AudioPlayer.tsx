import { useEffect, useRef, useState } from "preact/hooks";
import { Download, Pause, Play } from "preact-feather";
import type { SingleAudioResult } from "@/features/tts/signals";

type AudioPlayerProps = {
  result: SingleAudioResult | null;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
};

export function AudioPlayer({ result }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [result?.url]);

  if (!result) {
    return null;
  }

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const updateCurrentTime = (value: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <section className="audio-result">
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
      <button
        type="button"
        className="audio-play-button"
        aria-label={isPlaying ? "Pause generated audio" : "Play generated audio"}
        onClick={() => {
          void togglePlayback();
        }}
      >
        {isPlaying ? <Pause size={16} strokeWidth={1.9} /> : <Play size={16} strokeWidth={1.9} />}
      </button>
      <div className="audio-details">
        <span className="field-label">Generated audio</span>
        <strong>{result.filename}</strong>
        <span className="audio-meta">
          {result.voice} - {result.format.toUpperCase()} - {result.device.toUpperCase()}
        </span>
      </div>
      <label className="audio-seek">
        <span className="sr-only">Seek generated audio</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          disabled={duration === 0}
          onInput={(event) => {
            updateCurrentTime(Number((event.currentTarget as HTMLInputElement).value));
          }}
        />
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </label>
      <a className="icon-pill" href={result.url} download={result.filename} aria-label="Download generated audio">
        <Download size={15} strokeWidth={1.8} />
        Download
      </a>
    </section>
  );
}
