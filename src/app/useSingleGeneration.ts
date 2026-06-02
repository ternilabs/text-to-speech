import { useEffect, useRef } from "preact/hooks";
import { encodeMp3WithFallbackSignal } from "../features/tts/audio/mp3";
import { validateMp3 } from "../features/tts/audio/validate";
import { encodeWav } from "../features/tts/audio/wav";
import {
  appErrorSignal,
  appWarningsSignal,
  deviceSignal,
  outputFormatSignal,
  selectedVoiceSignal,
  singleAudioResultSignal,
  speedSignal,
  statusMessageSignal,
  statusSignal,
  textSignal,
} from "../features/tts/signals";
import type { OutputFormat } from "../features/tts/types";
import { createTtsWorkerClient } from "../features/tts/workerClient";

const revokeResultUrl = () => {
  if (singleAudioResultSignal.value) {
    URL.revokeObjectURL(singleAudioResultSignal.value.url);
  }
};

const toBlobPart = (bytes: ArrayBuffer | Uint8Array) => {
  if (!(bytes instanceof Uint8Array)) {
    return bytes;
  }

  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const createAudioResult = (
  bytes: ArrayBuffer | Uint8Array,
  format: OutputFormat,
  warnings: string[],
) => {
  const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
  const extension = format === "mp3" ? "mp3" : "wav";
  const blob = new Blob([toBlobPart(bytes)], { type: mimeType });
  const filename = `ternilabs-tts-${Date.now()}.${extension}`;

  revokeResultUrl();
  singleAudioResultSignal.value = {
    url: URL.createObjectURL(blob),
    filename,
    mimeType,
    format,
    requestedFormat: outputFormatSignal.value,
    voice: selectedVoiceSignal.value,
    device: deviceSignal.value,
    speed: speedSignal.value,
    warnings,
  };
};

export function useSingleGeneration(): {
  isGenerating: boolean;
  canGenerate: boolean;
  generate(): Promise<void>;
  cancel(): void;
} {
  const workerClientRef = useRef<ReturnType<typeof createTtsWorkerClient> | null>(null);
  const isGenerating = statusSignal.value === "loading-model" || statusSignal.value === "generating";
  const canGenerate = textSignal.value.trim().length > 0 && !isGenerating;

  useEffect(() => {
    return () => {
      workerClientRef.current?.dispose();
      revokeResultUrl();
    };
  }, []);

  const getWorkerClient = () => {
    workerClientRef.current ??= createTtsWorkerClient({
      onFallback: (message) => {
        appWarningsSignal.value = [...appWarningsSignal.value, message.message];
        statusMessageSignal.value = message.message;
      },
      onLoadProgress: (progress) => {
        statusMessageSignal.value = `Loading model ${Math.round(progress)}%`;
      },
    });

    return workerClientRef.current;
  };

  const generate = async () => {
    if (!canGenerate) {
      return;
    }

    appWarningsSignal.value = [];
    appErrorSignal.value = null;
    statusSignal.value = "loading-model";
    statusMessageSignal.value = "Loading model";

    try {
      const workerClient = getWorkerClient();
      await workerClient.load(deviceSignal.value);
      statusSignal.value = "generating";
      statusMessageSignal.value = "Generating audio";

      const audio = await workerClient.generate({
        text: textSignal.value.trim(),
        voice: selectedVoiceSignal.value,
        device: deviceSignal.value,
        speed: speedSignal.value,
      });
      const wavBuffer = encodeWav(audio);

      if (outputFormatSignal.value === "mp3") {
        const mp3 = await encodeMp3WithFallbackSignal(audio);
        const isValidMp3 = mp3.ok ? await validateMp3(mp3.bytes) : false;

        if (mp3.ok && isValidMp3) {
          createAudioResult(mp3.bytes, "mp3", []);
        } else {
          createAudioResult(wavBuffer, "wav", ["mp3_failed_fallback_wav"]);
        }
      } else {
        createAudioResult(wavBuffer, "wav", []);
      }

      statusSignal.value = "ready";
      statusMessageSignal.value = "Audio ready.";
    } catch (error) {
      statusSignal.value = "error";
      appErrorSignal.value = error instanceof Error ? error.message : "Unable to generate audio.";
      statusMessageSignal.value = "Generation failed.";
    }
  };

  const cancel = () => {
    workerClientRef.current?.cancel();
    statusSignal.value = "cancelled";
    statusMessageSignal.value = "Generation cancelled.";
  };

  return { isGenerating, canGenerate, generate, cancel };
}
