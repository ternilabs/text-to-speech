import type { DeviceOption, OutputFormat } from "./types";

export type VoiceOption = {
  id: string;
  name: string;
  language: string;
  gender: string;
  traits?: string;
};

export const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
export const DEFAULT_DEVICE: DeviceOption = "wasm";
export const DEFAULT_FORMAT: OutputFormat = "wav";
export const DEFAULT_SPEED = 1;
export const MP3_BITRATE_KBPS = 192;

export const VOICE_OPTIONS = [
  { id: "af_heart", name: "Heart", language: "en-us", gender: "Female", traits: "warm" },
  { id: "af_alloy", name: "Alloy", language: "en-us", gender: "Female" },
  { id: "af_aoede", name: "Aoede", language: "en-us", gender: "Female" },
  { id: "af_bella", name: "Bella", language: "en-us", gender: "Female", traits: "bright" },
  { id: "af_jessica", name: "Jessica", language: "en-us", gender: "Female" },
  { id: "af_kore", name: "Kore", language: "en-us", gender: "Female" },
  { id: "af_nicole", name: "Nicole", language: "en-us", gender: "Female", traits: "calm" },
  { id: "af_nova", name: "Nova", language: "en-us", gender: "Female" },
  { id: "af_river", name: "River", language: "en-us", gender: "Female" },
  { id: "af_sarah", name: "Sarah", language: "en-us", gender: "Female" },
  { id: "af_sky", name: "Sky", language: "en-us", gender: "Female" },
  { id: "am_adam", name: "Adam", language: "en-us", gender: "Male" },
  { id: "am_echo", name: "Echo", language: "en-us", gender: "Male" },
  { id: "am_eric", name: "Eric", language: "en-us", gender: "Male" },
  { id: "am_fenrir", name: "Fenrir", language: "en-us", gender: "Male" },
  { id: "am_liam", name: "Liam", language: "en-us", gender: "Male" },
  { id: "am_michael", name: "Michael", language: "en-us", gender: "Male" },
  { id: "am_onyx", name: "Onyx", language: "en-us", gender: "Male" },
  { id: "am_puck", name: "Puck", language: "en-us", gender: "Male" },
  { id: "am_santa", name: "Santa", language: "en-us", gender: "Male" },
  { id: "bf_emma", name: "Emma", language: "en-gb", gender: "Female" },
  { id: "bf_isabella", name: "Isabella", language: "en-gb", gender: "Female" },
  { id: "bf_alice", name: "Alice", language: "en-gb", gender: "Female" },
  { id: "bf_lily", name: "Lily", language: "en-gb", gender: "Female" },
  { id: "bm_george", name: "George", language: "en-gb", gender: "Male" },
  { id: "bm_lewis", name: "Lewis", language: "en-gb", gender: "Male" },
  { id: "bm_daniel", name: "Daniel", language: "en-gb", gender: "Male" },
  { id: "bm_fable", name: "Fable", language: "en-gb", gender: "Male" },
] as const satisfies readonly VoiceOption[];

export type VoiceId = (typeof VOICE_OPTIONS)[number]["id"];

export const LANGUAGE_LABELS: Record<string, string> = {
  "en-us": "American English",
  "en-gb": "British English",
};
