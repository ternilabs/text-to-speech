import { fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it } from "vitest";
import {
  appErrorSignal,
  appWarningsSignal,
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
  deviceSignal,
  modeSignal,
  outputFormatSignal,
  selectedVoiceSignal,
  settingsOpenSignal,
  singleAudioResultSignal,
  speedSignal,
  statusMessageSignal,
  statusSignal,
} from "@/features/tts/signals";
import { TTS_SETTINGS_STORAGE_KEY } from "@/features/tts/settingsStorage";
import { ComposerSettingsDropdown } from "@/features/composer/components/ComposerSettingsDropdown";
import { ModelDropdown } from "@/features/composer/components/ModelDropdown";

const resetSignals = () => {
  modeSignal.value = "single";
  bulkInputSourceSignal.value = "import";
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = "";
  bulkParseErrorSignal.value = null;
  bulkRowsSignal.value = [];
  selectedVoiceSignal.value = "af_heart";
  outputFormatSignal.value = "wav";
  deviceSignal.value = "wasm";
  speedSignal.value = 1;
  settingsOpenSignal.value = false;
  singleAudioResultSignal.value = null;
  statusSignal.value = "idle";
  statusMessageSignal.value = "Ready for local generation.";
  appErrorSignal.value = null;
  appWarningsSignal.value = [];
};

describe("ComposerSettingsDropdown", () => {
  beforeEach(() => {
    resetSignals();
    localStorage.clear();
  });

  it("opens settings dropdown on button click", () => {
    render(<ComposerSettingsDropdown />);

    const btn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(btn);

    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Generation type")).toBeTruthy();
  });

  it("switches mode via custom dropdown", () => {
    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk" }));

    expect(modeSignal.value).toBe("bulk");
  });

  it("selects format from dropdown", () => {
    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "MP3 Experimental" }));

    expect(outputFormatSignal.value).toBe("mp3");
  });

  it("selects backend from dropdown", () => {
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: {},
    });

    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "WebGPU" }));

    expect(deviceSignal.value).toBe("webgpu");
  });

  it("updates speed via range slider", () => {
    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.input(screen.getByRole("slider"), { target: { value: "1.15" } });

    expect(speedSignal.value).toBe(1.15);
  });

  it("closes settings when clicking outside", () => {
    render(
      <div>
        <ComposerSettingsDropdown />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(settingsOpenSignal.value).toBe(true);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(settingsOpenSignal.value).toBe(false);
  });

  it("closes settings on Escape", () => {
    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(settingsOpenSignal.value).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(settingsOpenSignal.value).toBe(false);
  });

  it("disables settings button while model is loading", () => {
    render(<ComposerSettingsDropdown disabled />);

    const btn = screen.getByRole("button", { name: "Settings" });
    expect(btn).toHaveProperty("disabled", true);
  });

  it("persists settings choices to localStorage", () => {
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: {},
    });

    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk" }));
    fireEvent.click(screen.getByRole("button", { name: "MP3 Experimental" }));
    fireEvent.click(screen.getByRole("button", { name: "WebGPU" }));
    fireEvent.input(screen.getByRole("slider"), { target: { value: "1.15" } });

    expect(JSON.parse(localStorage.getItem(TTS_SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      mode: "bulk",
      bulkInputSource: "import",
      voice: "af_heart",
      format: "mp3",
      device: "webgpu",
      speed: 1.15,
    });
  });

  it("switches bulk input source", () => {
    modeSignal.value = "bulk";

    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Paste rows" }));

    expect(bulkInputSourceSignal.value).toBe("paste");
  });

  it("resets audio result and status when switching mode", () => {
    singleAudioResultSignal.value = { url: "blob:test", filename: "test.wav", mimeType: "audio/wav", format: "wav", requestedFormat: "wav", voice: "af_heart", device: "wasm", speed: 1, warnings: [] };
    statusSignal.value = "ready";
    statusMessageSignal.value = "Audio ready.";
    appErrorSignal.value = "some error";
    appWarningsSignal.value = ["warning 1"];

    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk" }));

    expect(modeSignal.value).toBe("bulk");
    expect(singleAudioResultSignal.value).toBeNull();
    expect(statusSignal.value).toBe("idle");
    expect(statusMessageSignal.value).toBe("Ready for local generation.");
    expect(appErrorSignal.value).toBeNull();
    expect(appWarningsSignal.value).toEqual([]);
  });
});

describe("ModelDropdown", () => {
  it("shows Kokoro selected and Pollinations disabled", () => {
    render(<ModelDropdown />);

    expect(screen.getAllByText("Kokoro").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Local default synthesis model.")).toBeTruthy();
    expect(screen.getByText("Pollinations")).toBeTruthy();
    expect(screen.getAllByText(/Coming soon/).length).toBeGreaterThanOrEqual(1);
  });

  it("opens model menu on button click", () => {
    render(<ModelDropdown />);

    const btn = screen.getByRole("button", { name: "Select model" });
    fireEvent.click(btn);

    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("disables model button while loading", () => {
    render(<ModelDropdown disabled />);

    const btn = screen.getByRole("button", { name: "Select model" });
    expect(btn).toHaveProperty("disabled", true);
  });
});
