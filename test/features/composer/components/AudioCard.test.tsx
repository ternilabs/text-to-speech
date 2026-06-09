import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { SingleAudioResult } from "@/features/tts/signals";
import { AudioCard } from "@/features/composer/components/AudioCard";

const result: SingleAudioResult = {
  url: "blob:test-audio",
  filename: "ter-clip.wav",
  mimeType: "audio/wav",
  format: "wav",
  requestedFormat: "wav",
  voice: "af_heart",
  device: "wasm",
  speed: 1,
  warnings: [],
};

describe("AudioCard", () => {
  it("renders audio ready header, player controls, and download", () => {
    render(<AudioCard result={result} />);

    expect(screen.getByText("Audio ready.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play generated audio" })).toBeTruthy();
    expect(screen.getByText("ter-clip.wav")).toBeTruthy();
    expect(screen.getByText("Kokoro · WAV · af_heart · WASM · 1.00x")).toBeTruthy();
    expect(screen.getByText("WAV · 44.1 kHz · 16-bit")).toBeTruthy();

    const download = screen.getByRole("link", { name: "Download generated audio" }) as HTMLAnchorElement;
    expect(download.getAttribute("href")).toBe("blob:test-audio");
    expect(download.getAttribute("download")).toBe("ter-clip.wav");
  });

  it("shows MP3 format tag for mp3 results", () => {
    const mp3Result = { ...result, format: "mp3" as const };
    render(<AudioCard result={mp3Result} />);

    expect(screen.getByText("MP3 · 128 kbps")).toBeTruthy();
  });
});
