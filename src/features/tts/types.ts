export type DeviceOption = "wasm" | "webgpu";
export type OutputFormat = "wav" | "mp3";
export type TtsMode = "single" | "bulk";
export type TtsStatus =
  | "idle"
  | "loading-model"
  | "ready"
  | "generating"
  | "exporting"
  | "cancelled"
  | "error";

export type PcmAudio = {
  pcm: Float32Array;
  sampleRate: number;
};

export type TtsWorkerRequest =
  | { type: "load"; device: DeviceOption }
  | {
      type: "generate";
      jobId: string;
      text: string;
      voice: string;
      device: DeviceOption;
      speed?: number;
    }
  | { type: "cancel"; jobId: string };

export type TtsWorkerResponse =
  | { type: "load-progress"; progress: number }
  | { type: "load-ready"; device: DeviceOption }
  | { type: "generating"; jobId: string }
  | { type: "generated"; jobId: string; pcm: Float32Array; sampleRate: number }
  | { type: "fallback"; device: DeviceOption; message: string }
  | { type: "error"; jobId?: string; message: string };
