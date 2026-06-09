import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TTS_SETTINGS_STORAGE_KEY } from "./settingsStorage";

const importSignals = async () => {
  vi.resetModules();
  return import("./signals");
};

describe("tts signals settings persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("hydrates persisted generation settings on first import", async () => {
    localStorage.setItem(
      TTS_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        mode: "bulk",
        bulkInputSource: "paste",
        voice: "am_adam",
        format: "mp3",
        device: "wasm",
        speed: 1.15,
      }),
    );

    const signals = await importSignals();

    expect(signals.modeSignal.value).toBe("bulk");
    expect(signals.bulkInputSourceSignal.value).toBe("paste");
    expect(signals.selectedVoiceSignal.value).toBe("am_adam");
    expect(signals.outputFormatSignal.value).toBe("mp3");
    expect(signals.deviceSignal.value).toBe("wasm");
    expect(signals.speedSignal.value).toBe(1.15);
  });

  it("persists generation settings when signals change", async () => {
    const signals = await importSignals();

    signals.modeSignal.value = "bulk";
    signals.bulkInputSourceSignal.value = "paste";
    signals.selectedVoiceSignal.value = "am_adam";
    signals.outputFormatSignal.value = "mp3";
    signals.deviceSignal.value = "wasm";
    signals.speedSignal.value = 1.2;

    expect(JSON.parse(localStorage.getItem(TTS_SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      mode: "bulk",
      bulkInputSource: "paste",
      voice: "am_adam",
      format: "mp3",
      device: "wasm",
      speed: 1.2,
    });
  });

  it("keeps transient content out of the saved settings payload", async () => {
    const signals = await importSignals();

    signals.textSignal.value = "Do not persist";
    signals.bulkCsvTextSignal.value = "id,text\nintro,Do not persist";
    signals.bulkFileNameSignal.value = "clips.csv";
    signals.bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Do not persist" }];
    signals.bulkParseErrorSignal.value = "Do not persist";
    signals.settingsOpenSignal.value = true;
    signals.singleAudioResultSignal.value = {
      url: "blob:test-audio",
      filename: "clip.wav",
      mimeType: "audio/wav",
      format: "wav",
      requestedFormat: "wav",
      voice: "af_heart",
      device: "wasm",
      speed: 1,
      warnings: [],
    };

    expect(JSON.parse(localStorage.getItem(TTS_SETTINGS_STORAGE_KEY) ?? "{}")).toEqual({
      mode: "single",
      bulkInputSource: "import",
      voice: "af_heart",
      format: "wav",
      device: "wasm",
      speed: 1,
    });
  });

  it("falls back to defaults for invalid saved generation settings", async () => {
    localStorage.setItem(
      TTS_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        mode: "invalid",
        bulkInputSource: "invalid",
        voice: "invalid",
        format: "invalid",
        device: "invalid",
        speed: "invalid",
      }),
    );

    const signals = await importSignals();

    expect(signals.modeSignal.value).toBe("single");
    expect(signals.bulkInputSourceSignal.value).toBe("import");
    expect(signals.selectedVoiceSignal.value).toBe("af_heart");
    expect(signals.outputFormatSignal.value).toBe("wav");
    expect(signals.deviceSignal.value).toBe("wasm");
    expect(signals.speedSignal.value).toBe(1);
  });

  it("hydrates stored WebGPU as WASM when WebGPU is unavailable", async () => {
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: undefined,
    });
    localStorage.setItem(
      TTS_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        mode: "single",
        bulkInputSource: "import",
        voice: "af_heart",
        format: "wav",
        device: "webgpu",
        speed: 1,
      }),
    );

    const signals = await importSignals();

    expect(signals.deviceSignal.value).toBe("wasm");
  });
});
