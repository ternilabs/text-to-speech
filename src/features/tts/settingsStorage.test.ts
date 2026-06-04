import { describe, expect, it, vi } from "vitest";
import {
  TTS_SETTINGS_STORAGE_KEY,
  loadStoredTtsSettings,
  normalizeTtsSettings,
  saveTtsSettings,
} from "./settingsStorage";

const createStorage = (initialValue: string | null = null) => {
  let value = initialValue;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_: string, nextValue: string) => {
      value = nextValue;
    }),
  };
};

describe("settingsStorage", () => {
  it("returns null when no settings were saved", () => {
    const storage = createStorage(null);

    expect(loadStoredTtsSettings(storage)).toBeNull();
    expect(storage.getItem).toHaveBeenCalledWith(TTS_SETTINGS_STORAGE_KEY);
  });

  it("returns null for malformed JSON", () => {
    const storage = createStorage("{not-json");

    expect(loadStoredTtsSettings(storage)).toBeNull();
  });

  it("loads valid saved generation settings", () => {
    const storage = createStorage(
      JSON.stringify({
        mode: "bulk",
        bulkInputSource: "paste",
        voice: "am_adam",
        format: "mp3",
        device: "wasm",
        speed: 1.15,
      }),
    );

    expect(loadStoredTtsSettings(storage)).toEqual({
      mode: "bulk",
      bulkInputSource: "paste",
      voice: "am_adam",
      format: "mp3",
      device: "wasm",
      speed: 1.15,
    });
  });

  it("falls back from stored WebGPU to WASM when WebGPU is unavailable", () => {
    const storage = createStorage(
      JSON.stringify({
        mode: "single",
        bulkInputSource: "import",
        voice: "af_heart",
        format: "wav",
        device: "webgpu",
        speed: 1,
      }),
    );

    expect(loadStoredTtsSettings(storage, { hasWebGpu: false })?.device).toBe("wasm");
  });

  it("preserves stored WebGPU when WebGPU is available", () => {
    const storage = createStorage(
      JSON.stringify({
        mode: "single",
        bulkInputSource: "import",
        voice: "af_heart",
        format: "wav",
        device: "webgpu",
        speed: 1,
      }),
    );

    expect(loadStoredTtsSettings(storage, { hasWebGpu: true })?.device).toBe("webgpu");
  });

  it("ignores invalid strings and clamps speed", () => {
    expect(
      normalizeTtsSettings(
        {
          mode: "chapter",
          bulkInputSource: "upload",
          voice: "missing_voice",
          format: "flac",
          device: "gpu",
          speed: 5,
        },
        { hasWebGpu: true },
      ),
    ).toEqual({
      mode: "single",
      bulkInputSource: "import",
      voice: "af_heart",
      format: "wav",
      device: "wasm",
      speed: 1.25,
    });
  });

  it("uses the default speed for non-number speed values", () => {
    expect(normalizeTtsSettings({ speed: "fast" }, { hasWebGpu: true }).speed).toBe(1);
  });

  it("clamps speed to the lower bound", () => {
    expect(normalizeTtsSettings({ speed: 0.1 }, { hasWebGpu: true }).speed).toBe(0.75);
  });

  it("saves a validated settings payload", () => {
    const storage = createStorage();

    saveTtsSettings(
      {
        mode: "bulk",
        bulkInputSource: "paste",
        voice: "am_adam",
        format: "mp3",
        device: "webgpu",
        speed: 1.2,
      },
      storage,
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      TTS_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        mode: "bulk",
        bulkInputSource: "paste",
        voice: "am_adam",
        format: "mp3",
        device: "webgpu",
        speed: 1.2,
      }),
    );
  });

  it("swallows localStorage get and set failures", () => {
    const failingStorage = {
      getItem: vi.fn(() => {
        throw new Error("storage denied");
      }),
      setItem: vi.fn(() => {
        throw new Error("storage denied");
      }),
    };

    expect(loadStoredTtsSettings(failingStorage)).toBeNull();
    expect(() =>
      saveTtsSettings(
        {
          mode: "single",
          bulkInputSource: "import",
          voice: "af_heart",
          format: "wav",
          device: "wasm",
          speed: 1,
        },
        failingStorage,
      ),
    ).not.toThrow();
  });
});
