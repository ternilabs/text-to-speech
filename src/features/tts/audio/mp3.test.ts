import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeMp3WithFallbackSignal } from "./mp3";
import { validateMp3 } from "./validate";

const { createMp3Encoder } = vi.hoisted(() => ({
  createMp3Encoder: vi.fn(),
}));

vi.mock("wasm-media-encoders", () => ({
  createMp3Encoder,
}));

describe("encodeMp3WithFallbackSignal", () => {
  beforeEach(() => {
    createMp3Encoder.mockReset();
  });

  it("returns MP3 bytes when encoding succeeds", async () => {
    const configure = vi.fn();
    const encode = vi.fn(() => new Uint8Array([1, 2]));
    const finalize = vi.fn(() => new Uint8Array([3]));
    createMp3Encoder.mockResolvedValue({ configure, encode, finalize });

    const result = await encodeMp3WithFallbackSignal({
      pcm: new Float32Array([0, 0.5]),
      sampleRate: 24000,
    });

    expect(result).toEqual({ ok: true, bytes: new Uint8Array([1, 2, 3]), mimeType: "audio/mpeg" });
    expect(configure).toHaveBeenCalledWith({ channels: 1, sampleRate: 24000, bitrate: 192 });
    expect(encode).toHaveBeenCalledWith([new Float32Array([0, 0.5])]);
    expect(finalize).toHaveBeenCalledOnce();
  });

  it("returns a fallback signal when encoding fails", async () => {
    createMp3Encoder.mockRejectedValue(new Error("encoder unavailable"));

    const result = await encodeMp3WithFallbackSignal({
      pcm: new Float32Array([0]),
      sampleRate: 24000,
    });

    expect(result).toEqual({ ok: false, reason: "encoder unavailable" });
  });
});

describe("validateMp3", () => {
  it("returns false when the browser cannot decode the MP3 bytes", async () => {
    const audioGlobal = globalThis as typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
    const originalAudioContext = audioGlobal.AudioContext;
    const originalWebkitAudioContext = audioGlobal.webkitAudioContext;

    class FailingAudioContext {
      decodeAudioData() {
        return Promise.reject(new Error("decode failed"));
      }

      close() {
        return Promise.resolve();
      }
    }

    audioGlobal.AudioContext = FailingAudioContext as unknown as typeof AudioContext;
    audioGlobal.webkitAudioContext = undefined;

    await expect(validateMp3(new Uint8Array([1, 2, 3]))).resolves.toBe(false);

    audioGlobal.AudioContext = originalAudioContext;
    audioGlobal.webkitAudioContext = originalWebkitAudioContext;
  });
});
