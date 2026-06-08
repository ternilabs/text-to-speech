import type {
  DeviceOption,
  PcmAudio,
  TtsWorkerRequest,
  TtsWorkerResponse,
} from "./types";

type GenerateInput = {
  text: string;
  voice: string;
  device: DeviceOption;
  speed?: number;
};

type TtsWorkerClientOptions = {
  onFallback?: (message: Extract<TtsWorkerResponse, { type: "fallback" }>) => void;
  onLoadProgress?: (progress: number) => void;
  onGenerating?: (jobId: string) => void;
};

type PendingLoad = {
  resolve: () => void;
  reject: (error: Error) => void;
};

type PendingGeneration = {
  jobId: string;
  resolve: (audio: PcmAudio) => void;
  reject: (error: Error) => void;
};

const createJobId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const post = (worker: Worker, message: TtsWorkerRequest) => {
  worker.postMessage(message);
};

export function createTtsWorkerClient(options: TtsWorkerClientOptions = {}) {
  const worker = new Worker(new URL("./tts.worker.ts", import.meta.url), { type: "module" });
  let pendingLoad: PendingLoad | null = null;
  let pendingGeneration: PendingGeneration | null = null;
  let disposed = false;

  const rejectPending = (error: Error) => {
    pendingLoad?.reject(error);
    pendingLoad = null;
    pendingGeneration?.reject(error);
    pendingGeneration = null;
  };

  const handleMessage = (event: MessageEvent<TtsWorkerResponse>) => {
    const message = event.data;

    if (message.type === "load-progress") {
      options.onLoadProgress?.(message.progress);
      return;
    }

    if (message.type === "load-ready") {
      pendingLoad?.resolve();
      pendingLoad = null;
      return;
    }

    if (message.type === "generating") {
      options.onGenerating?.(message.jobId);
      return;
    }

    if (message.type === "fallback") {
      options.onFallback?.(message);
      return;
    }

    if (message.type === "generated") {
      if (!pendingGeneration || pendingGeneration.jobId !== message.jobId) {
        return;
      }

      pendingGeneration.resolve({
        pcm: message.pcm,
        sampleRate: message.sampleRate,
      });
      pendingGeneration = null;
      return;
    }

    if (message.type === "error") {
      const error = new Error(message.message);
      if (message.jobId && pendingGeneration?.jobId === message.jobId) {
        pendingGeneration.reject(error);
        pendingGeneration = null;
        return;
      }

      pendingLoad?.reject(error);
      pendingLoad = null;
    }
  };

  worker.addEventListener("message", handleMessage);
  worker.addEventListener("error", () => {
    rejectPending(new Error("TTS worker crashed. Refresh and try again."));
  });

  return {
    load(device: DeviceOption): Promise<void> {
      if (disposed) {
        return Promise.reject(new Error("TTS worker client is disposed."));
      }
      if (pendingLoad) {
        return Promise.reject(new Error("Model load already in progress."));
      }

      return new Promise((resolve, reject) => {
        pendingLoad = { resolve, reject };
        post(worker, { type: "load", device });
      });
    },

    generate(input: GenerateInput): Promise<PcmAudio> {
      if (disposed) {
        return Promise.reject(new Error("TTS worker client is disposed."));
      }
      if (pendingGeneration) {
        return Promise.reject(new Error("Generation already in progress."));
      }

      const jobId = createJobId();
      return new Promise((resolve, reject) => {
        pendingGeneration = { jobId, resolve, reject };
        post(worker, { type: "generate", jobId, ...input });
      });
    },

    cancel(jobId?: string) {
      const activeJobId = jobId ?? pendingGeneration?.jobId;
      if (!activeJobId || disposed) {
        return;
      }

      post(worker, { type: "cancel", jobId: activeJobId });
      if (pendingGeneration?.jobId === activeJobId) {
        pendingGeneration.reject(new Error("Generation cancelled"));
        pendingGeneration = null;
      }
    },

    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
      rejectPending(new Error("TTS worker client disposed."));
    },
  };
}
