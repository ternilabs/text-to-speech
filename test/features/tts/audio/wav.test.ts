import { describe, expect, it } from "vitest";
import { encodeWav } from "@/features/tts/audio/wav";

describe("encodeWav", () => {
  it("writes RIFF/WAVE headers and PCM data", () => {
    const wav = encodeWav({ pcm: new Float32Array([0, 0.5, -0.5]), sampleRate: 24000 });
    const view = new DataView(wav);
    const text = (offset: number, length: number) =>
      String.fromCharCode(...new Uint8Array(wav, offset, length));

    expect(text(0, 4)).toBe("RIFF");
    expect(text(8, 4)).toBe("WAVE");
    expect(view.getUint32(24, true)).toBe(24000);
    expect(text(36, 4)).toBe("data");
  });
});
