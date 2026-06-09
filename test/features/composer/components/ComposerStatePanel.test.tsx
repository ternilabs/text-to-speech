import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { SingleAudioResult } from "@/features/tts/signals";
import { ComposerStatePanel } from "@/features/composer/components/ComposerStatePanel";

describe("ComposerStatePanel", () => {
  it("shows loading-model as a visible working status", () => {
    render(
      <ComposerStatePanel
        mode="single"
        status="loading-model"
        message="Loading Kokoro model"
        warnings={[]}
        error={null}
        result={null}
      />,
    );

    expect(screen.getByText("Loading Kokoro model")).toBeTruthy();
    expect(document.querySelector(".composer-state-panel--working")).toBeTruthy();
  });

  it("shows the finished bulk state without rendering a single audio player", () => {
    render(
      <ComposerStatePanel
        mode="bulk"
        status="ready"
        message="Bulk export finished."
        warnings={[]}
        error={null}
        result={null}
      />,
    );

    expect(screen.getByText("Bulk export finished.")).toBeTruthy();
    expect(screen.queryByLabelText("Generated audio player")).toBeNull();
    expect(document.querySelector(".composer-state-panel--success")).toBeTruthy();
  });

  it("renders the generated audio player for ready single results", () => {
    const result: SingleAudioResult = {
      url: "blob:test-audio",
      filename: "single.wav",
      mimeType: "audio/wav",
      format: "wav",
      requestedFormat: "wav",
      voice: "af_heart",
      device: "wasm",
      speed: 1,
      warnings: [],
    };

    render(
      <ComposerStatePanel
        mode="single"
        status="ready"
        message="Audio ready."
        warnings={[]}
        error={null}
        result={result}
      />,
    );

    expect(screen.getByLabelText("Generated audio player")).toBeTruthy();
    expect(screen.getByText("single.wav")).toBeTruthy();
  });
});
