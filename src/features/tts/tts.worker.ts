import { RawAudio } from "@huggingface/transformers";
import { KokoroTTS, TextSplitterStream, env as kokoroEnv } from "kokoro-js";
import { KOKORO_MODEL_ID } from "./constants";
import type { DeviceOption, TtsWorkerRequest, TtsWorkerResponse } from "./types";

const ORT_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0-dev.20250409-89f8206ba4/dist/";

kokoroEnv.wasmPaths = ORT_WASM_PATH;

type KokoroVoice = Parameters<KokoroTTS["generate"]>[1] extends { voice?: infer Voice }
  ? Voice
  : never;

type GenerateOptions = {
  voice: KokoroVoice;
  speed?: number;
};

let tts: KokoroTTS | null = null;
let activeDevice: DeviceOption | null = null;
const cancelledJobs = new Set<string>();

const post = (message: TtsWorkerResponse) => {
  self.postMessage(message);
};

const createInstance = async (device: DeviceOption) => {
  const dtype = device === "webgpu" ? "fp32" : "q8";

  return KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
    dtype,
    device,
    progress_callback: (info) => {
      if (info.status === "progress") {
        post({ type: "load-progress", progress: info.progress });
      }
      if (info.status === "ready" || info.status === "done") {
        post({ type: "load-ready", device });
      }
    },
  });
};

const loadModel = async (device: DeviceOption) => {
  if (tts && activeDevice === device) {
    post({ type: "load-ready", device });
    return tts;
  }

  tts = null;
  activeDevice = device;
  post({ type: "load-progress", progress: 0 });

  try {
    const instance = await createInstance(device);
    tts = instance;
    activeDevice = device;
    post({ type: "load-ready", device });
    return instance;
  } catch (error) {
    if (device !== "webgpu") {
      throw error;
    }

    post({
      type: "fallback",
      device: "wasm",
      message: "WebGPU failed in this browser. Falling back to CPU.",
    });
    const instance = await createInstance("wasm");
    tts = instance;
    activeDevice = "wasm";
    post({ type: "load-ready", device: "wasm" });
    return instance;
  }
};

const buildTextStream = (text: string) => {
  const splitter = new TextSplitterStream();
  splitter.push(text);
  splitter.close();
  return splitter;
};

const generateAudio = async (
  instance: KokoroTTS,
  jobId: string,
  text: string,
  options: GenerateOptions,
) => {
  const segments: Float32Array[] = [];
  let totalLength = 0;
  let sampleRate = 24000;

  const stream = buildTextStream(text);
  for await (const { audio } of instance.stream(stream, options)) {
    if (cancelledJobs.has(jobId)) {
      throw new Error("Generation cancelled.");
    }
    if (audio.audio.length === 0) {
      continue;
    }
    segments.push(new Float32Array(audio.audio));
    totalLength += audio.audio.length;
    sampleRate = audio.sampling_rate;
  }

  if (segments.length === 0) {
    return instance.generate(text, options);
  }

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const segment of segments) {
    merged.set(segment, offset);
    offset += segment.length;
  }

  return new RawAudio(merged, sampleRate);
};

const handleLoad = async (device: DeviceOption) => {
  try {
    await loadModel(device);
  } catch {
    post({ type: "error", message: "Failed to load Kokoro model." });
  }
};

const handleGenerate = async (data: Extract<TtsWorkerRequest, { type: "generate" }>) => {
  try {
    cancelledJobs.delete(data.jobId);
    const instance = await loadModel(data.device);
    post({ type: "generating", jobId: data.jobId });
    const audio = await generateAudio(instance, data.jobId, data.text, {
      voice: data.voice as KokoroVoice,
      speed: data.speed,
    });

    if (cancelledJobs.has(data.jobId)) {
      throw new Error("Generation cancelled.");
    }

    post({
      type: "generated",
      jobId: data.jobId,
      pcm: new Float32Array(audio.audio),
      sampleRate: audio.sampling_rate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate audio.";
    post({ type: "error", jobId: data.jobId, message });
  } finally {
    cancelledJobs.delete(data.jobId);
  }
};

self.onmessage = (event: MessageEvent<TtsWorkerRequest>) => {
  const data = event.data;

  if (data.type === "load") {
    void handleLoad(data.device);
    return;
  }

  if (data.type === "cancel") {
    cancelledJobs.add(data.jobId);
    return;
  }

  void handleGenerate(data);
};
