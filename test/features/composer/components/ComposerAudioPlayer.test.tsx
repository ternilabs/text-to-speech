import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { SingleAudioResult } from "@/features/tts/signals";
import { ComposerAudioPlayer } from "@/features/composer/components/ComposerAudioPlayer";

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

describe("ComposerAudioPlayer", () => {
  it("renders generated audio controls, metadata, seek, and download", () => {
    render(<ComposerAudioPlayer result={result} />);

    expect(screen.getByRole("button", { name: "Play generated audio" })).toBeTruthy();
    expect(screen.getByText("ter-clip.wav")).toBeTruthy();
    expect(screen.getByText("Kokoro · WAV · af_heart · WASM · 1.00x")).toBeTruthy();
    expect(screen.getByLabelText("Seek generated audio")).toBeTruthy();

    const download = screen.getByRole("link", { name: "Download generated audio" }) as HTMLAnchorElement;
    expect(download.getAttribute("href")).toBe("blob:test-audio");
    expect(download.getAttribute("download")).toBe("ter-clip.wav");
  });
});
