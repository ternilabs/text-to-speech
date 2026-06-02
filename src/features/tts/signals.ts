import { signal } from "@preact/signals";
import {
  DEFAULT_DEVICE,
  DEFAULT_FORMAT,
  DEFAULT_SPEED,
  VOICE_OPTIONS,
} from "./constants";
import type { DeviceOption, OutputFormat, TtsMode, TtsStatus } from "./types";
import type { BulkRow } from "../bulk/csv";

export type SingleAudioResult = {
  url: string;
  filename: string;
  mimeType: string;
  format: OutputFormat;
  requestedFormat: OutputFormat;
  voice: string;
  device: DeviceOption;
  speed: number;
  warnings: string[];
};

export const modeSignal = signal<TtsMode>("single");
export const textSignal = signal("");
export const selectedVoiceSignal = signal<string>(VOICE_OPTIONS[0].id);
export const outputFormatSignal = signal<OutputFormat>(DEFAULT_FORMAT);
export const deviceSignal = signal<DeviceOption>(DEFAULT_DEVICE);
export const speedSignal = signal(DEFAULT_SPEED);
export const settingsOpenSignal = signal(false);
export const statusSignal = signal<TtsStatus>("idle");
export const statusMessageSignal = signal("Ready for local generation.");
export const singleAudioResultSignal = signal<SingleAudioResult | null>(null);
export const appWarningsSignal = signal<string[]>([]);
export const appErrorSignal = signal<string | null>(null);
export const bulkRowsSignal = signal<BulkRow[]>([]);
export const bulkFileNameSignal = signal("");
export const bulkParseErrorSignal = signal<string | null>(null);
