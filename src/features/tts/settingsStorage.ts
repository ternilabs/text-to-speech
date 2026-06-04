import {
  DEFAULT_DEVICE,
  DEFAULT_FORMAT,
  DEFAULT_SPEED,
  VOICE_OPTIONS,
} from "./constants";
import type { BulkInputSource, DeviceOption, OutputFormat, TtsMode } from "./types";

export const TTS_SETTINGS_STORAGE_KEY = "ternilabs-tts-settings-v1";
const MIN_SPEED = 0.75;
const MAX_SPEED = 1.25;

export type StoredTtsSettings = {
  mode: TtsMode;
  bulkInputSource: BulkInputSource;
  voice: string;
  format: OutputFormat;
  device: DeviceOption;
  speed: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type NormalizeOptions = {
  hasWebGpu?: boolean;
};

const DEFAULT_SETTINGS: StoredTtsSettings = {
  mode: "single",
  bulkInputSource: "import",
  voice: VOICE_OPTIONS[0].id,
  format: DEFAULT_FORMAT,
  device: DEFAULT_DEVICE,
  speed: DEFAULT_SPEED,
};

const modeValues = new Set<TtsMode>(["single", "bulk"]);
const bulkInputSourceValues = new Set<BulkInputSource>(["import", "paste"]);
const formatValues = new Set<OutputFormat>(["wav", "mp3"]);
const deviceValues = new Set<DeviceOption>(["wasm", "webgpu"]);
const voiceValues = new Set<string>(VOICE_OPTIONS.map((voice) => voice.id));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasNavigatorWebGpu = () =>
  typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);

const getLocalStorage = (): StorageLike | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

const clampSpeed = (speed: number) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed));

export const normalizeTtsSettings = (
  value: unknown,
  options: NormalizeOptions = {},
): StoredTtsSettings => {
  const hasWebGpu = options.hasWebGpu ?? hasNavigatorWebGpu();
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  const mode =
    typeof value.mode === "string" && modeValues.has(value.mode as TtsMode)
      ? (value.mode as TtsMode)
      : DEFAULT_SETTINGS.mode;
  const bulkInputSource =
    typeof value.bulkInputSource === "string" && bulkInputSourceValues.has(value.bulkInputSource as BulkInputSource)
      ? (value.bulkInputSource as BulkInputSource)
      : DEFAULT_SETTINGS.bulkInputSource;
  const voice = typeof value.voice === "string" && voiceValues.has(value.voice) ? value.voice : DEFAULT_SETTINGS.voice;
  const format =
    typeof value.format === "string" && formatValues.has(value.format as OutputFormat)
      ? (value.format as OutputFormat)
      : DEFAULT_SETTINGS.format;
  const rawDevice =
    typeof value.device === "string" && deviceValues.has(value.device as DeviceOption)
      ? (value.device as DeviceOption)
      : DEFAULT_SETTINGS.device;
  const device = rawDevice === "webgpu" && !hasWebGpu ? DEFAULT_DEVICE : rawDevice;
  const speed =
    typeof value.speed === "number" && Number.isFinite(value.speed)
      ? clampSpeed(value.speed)
      : DEFAULT_SETTINGS.speed;

  return {
    mode,
    bulkInputSource,
    voice,
    format,
    device,
    speed,
  };
};

export const loadStoredTtsSettings = (
  storage: StorageLike | null = getLocalStorage(),
  options: NormalizeOptions = {},
): StoredTtsSettings | null => {
  if (!storage) return null;

  try {
    const storedValue = storage.getItem(TTS_SETTINGS_STORAGE_KEY);
    if (!storedValue) return null;
    return normalizeTtsSettings(JSON.parse(storedValue), options);
  } catch {
    return null;
  }
};

export const saveTtsSettings = (
  settings: StoredTtsSettings,
  storage: StorageLike | null = getLocalStorage(),
) => {
  if (!storage) return;

  try {
    storage.setItem(TTS_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeTtsSettings(settings, { hasWebGpu: true })));
  } catch {
    // Storage can fail in private browsing modes or restricted environments.
  }
};
