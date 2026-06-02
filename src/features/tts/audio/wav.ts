import type { PcmAudio } from "../types";

const WAV_HEADER_BYTES = 44;
const PCM_FORMAT = 1;
const CHANNEL_COUNT = 1;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;

const writeString = (view: DataView, offset: number, value: string) => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

const floatToInt16 = (sample: number) => {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
};

export function encodeWav({ pcm, sampleRate }: PcmAudio): ArrayBuffer {
  const dataBytes = pcm.length * BYTES_PER_SAMPLE;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);
  const byteRate = sampleRate * CHANNEL_COUNT * BYTES_PER_SAMPLE;
  const blockAlign = CHANNEL_COUNT * BYTES_PER_SAMPLE;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, CHANNEL_COUNT, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  for (let index = 0; index < pcm.length; index += 1) {
    view.setInt16(WAV_HEADER_BYTES + index * BYTES_PER_SAMPLE, floatToInt16(pcm[index]), true);
  }

  return buffer;
}
