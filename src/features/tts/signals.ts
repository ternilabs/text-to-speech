import { effect, signal } from "@preact/signals";
import {
  DEFAULT_DEVICE,
  DEFAULT_FORMAT,
  DEFAULT_SPEED,
  VOICE_OPTIONS,
} from "./constants";
import { loadStoredTtsSettings, saveTtsSettings } from "./settingsStorage";
import type { BulkInputSource, DeviceOption, OutputFormat, TtsMode, TtsStatus } from "./types";
import type { BulkRow } from "@/features/bulk/csv";

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

const storedSettings = loadStoredTtsSettings();

export const modeSignal = signal<TtsMode>(storedSettings?.mode ?? "single");
export const bulkInputSourceSignal = signal<BulkInputSource>(storedSettings?.bulkInputSource ?? "import");
export const bulkCsvTextSignal = signal("");
export const textSignal = signal("");
export const selectedVoiceSignal = signal<string>(storedSettings?.voice ?? VOICE_OPTIONS[0].id);
export const outputFormatSignal = signal<OutputFormat>(storedSettings?.format ?? DEFAULT_FORMAT);
export const deviceSignal = signal<DeviceOption>(storedSettings?.device ?? DEFAULT_DEVICE);
export const speedSignal = signal(storedSettings?.speed ?? DEFAULT_SPEED);
export const settingsOpenSignal = signal(false);
export const statusSignal = signal<TtsStatus>("idle");
export const statusMessageSignal = signal("Ready for local generation.");
export const singleAudioResultSignal = signal<SingleAudioResult | null>(null);
export const appWarningsSignal = signal<string[]>([]);
export const appErrorSignal = signal<string | null>(null);
export const bulkRowsSignal = signal<BulkRow[]>([]);
export const bulkFileNameSignal = signal("");
export const bulkParseErrorSignal = signal<string | null>(null);

effect(() => {
  saveTtsSettings({
    mode: modeSignal.value,
    bulkInputSource: bulkInputSourceSignal.value,
    voice: selectedVoiceSignal.value,
    format: outputFormatSignal.value,
    device: deviceSignal.value,
    speed: speedSignal.value,
  });
});
