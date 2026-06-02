import { createMp3Encoder } from "wasm-media-encoders";
import { MP3_BITRATE_KBPS } from "../constants";
import type { PcmAudio } from "../types";

export type Mp3EncodeResult =
  | { ok: true; bytes: Uint8Array; mimeType: "audio/mpeg" }
  | { ok: false; reason: string };

type Mp3Encoder = Awaited<ReturnType<typeof createMp3Encoder>>;

const copyChunk = (chunk: Uint8Array) => new Uint8Array(chunk);

const concatChunks = (chunks: Uint8Array[]) => {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return bytes;
};

const encodeWithEncoder = (encoder: Mp3Encoder, audio: PcmAudio) => {
  encoder.configure({
    channels: 1,
    sampleRate: audio.sampleRate,
    bitrate: MP3_BITRATE_KBPS,
  });

  return concatChunks([copyChunk(encoder.encode([audio.pcm])), copyChunk(encoder.finalize())]);
};

export async function encodeMp3WithFallbackSignal(audio: PcmAudio): Promise<Mp3EncodeResult> {
  try {
    const encoder = await createMp3Encoder();
    const bytes = encodeWithEncoder(encoder, audio);
    return { ok: true, bytes, mimeType: "audio/mpeg" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unable to encode MP3.";
    return { ok: false, reason };
  }
}
