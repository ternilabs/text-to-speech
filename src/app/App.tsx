import { useEffect, useRef } from "preact/hooks";
import { Download, RefreshCw, Volume2, X } from "preact-feather";
import { CsvDropzone } from "../features/bulk/components/CsvDropzone";
import { useBulkExport } from "../features/bulk/useBulkExport";
import { encodeMp3WithFallbackSignal } from "../features/tts/audio/mp3";
import { validateMp3 } from "../features/tts/audio/validate";
import { encodeWav } from "../features/tts/audio/wav";
import { AdvancedSettings } from "../features/tts/components/AdvancedSettings";
import { AudioPlayer } from "../features/tts/components/AudioPlayer";
import { EssentialControls } from "../features/tts/components/EssentialControls";
import { StatusPanel } from "../features/tts/components/StatusPanel";
import { TextInputPanel } from "../features/tts/components/TextInputPanel";
import {
  appErrorSignal,
  appWarningsSignal,
  bulkRowsSignal,
  deviceSignal,
  modeSignal,
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

const createAudioResult = (
  bytes: ArrayBuffer | Uint8Array,
  format: OutputFormat,
  warnings: string[],
) => {
  const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
  const extension = format === "mp3" ? "mp3" : "wav";
  const blobPart = bytes instanceof Uint8Array ? new ArrayBuffer(bytes.byteLength) : bytes;
  if (bytes instanceof Uint8Array) {
    new Uint8Array(blobPart).set(bytes);
  }
  const blob = new Blob([blobPart], { type: mimeType });
  const filename = `ternilabs-tts-${Date.now()}.${extension}`;

  revokeResultUrl();
  singleAudioResultSignal.value = {
    url: URL.createObjectURL(blob),
    filename,
    mimeType,
    format,
    warnings,
  };
};

export function App() {
  const workerClientRef = useRef<ReturnType<typeof createTtsWorkerClient> | null>(null);
  const bulkExport = useBulkExport();
  const isSingleMode = modeSignal.value === "single";
  const isSingleBusy = statusSignal.value === "loading-model" || statusSignal.value === "generating";
  const isBusy = isSingleBusy || bulkExport.isExporting;
  const canGenerateSingle = textSignal.value.trim().length > 0 && !isBusy;
  const canGenerateBulk = bulkRowsSignal.value.length > 0 && !isBusy;
  const mergedWarnings = [
    ...appWarningsSignal.value,
    ...bulkExport.warnings,
    ...(singleAudioResultSignal.value?.warnings ?? []),
  ];
  const mergedError = appErrorSignal.value ?? bulkExport.error;
  const statusMessage = bulkExport.isExporting
    ? `Exporting zip (${bulkExport.progress.current}/${bulkExport.progress.total})`
    : statusMessageSignal.value;

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

  const handleSingleGenerate = async () => {
    if (!canGenerateSingle) {
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

  const handleBulkGenerate = async () => {
    if (!canGenerateBulk) {
      return;
    }

    appWarningsSignal.value = [];
    appErrorSignal.value = null;
    statusSignal.value = "exporting";
    statusMessageSignal.value = "Exporting zip";

    try {
      await bulkExport.generateZip({
        rows: bulkRowsSignal.value,
        voice: selectedVoiceSignal.value,
        device: deviceSignal.value,
        format: outputFormatSignal.value,
        speed: speedSignal.value,
      });

      statusSignal.value = "ready";
      statusMessageSignal.value = "Bulk export finished.";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk export failed.";
      if (message === "Bulk export cancelled.") {
        statusSignal.value = "cancelled";
        statusMessageSignal.value = message;
      } else {
        statusSignal.value = "error";
        statusMessageSignal.value = "Bulk export failed.";
        appErrorSignal.value = message;
      }
    }
  };

  const handleCancel = () => {
    if (bulkExport.isExporting) {
      bulkExport.cancel();
      statusSignal.value = "cancelled";
      statusMessageSignal.value = "Cancelling bulk export.";
      return;
    }

    workerClientRef.current?.cancel();
    statusSignal.value = "cancelled";
    statusMessageSignal.value = "Generation cancelled.";
  };

  return (
    <main className="app-shell">
      <section className="brand-block" aria-label="TerniLabs Text-to-Speech">
        <h1>TerniLabs</h1>
        <p>Browser-only text-to-speech for single prompts and CSV batches.</p>
      </section>

      <section className="tts-card">
        <div className="mode-toggle" role="tablist" aria-label="Generation mode">
          <button
            type="button"
            className={isSingleMode ? "active" : ""}
            onClick={() => {
              modeSignal.value = "single";
            }}
          >
            Single
          </button>
          <button
            type="button"
            className={!isSingleMode ? "active" : ""}
            onClick={() => {
              modeSignal.value = "bulk";
            }}
          >
            Bulk CSV
          </button>
        </div>

        {isSingleMode ? <TextInputPanel /> : <CsvDropzone />}

        <EssentialControls />
        <AdvancedSettings />

        <div className="action-row">
          <button
            type="button"
            className="primary-button"
            disabled={isSingleMode ? !canGenerateSingle : !canGenerateBulk}
            onClick={isSingleMode ? handleSingleGenerate : handleBulkGenerate}
          >
            {isBusy ? <RefreshCw size={16} strokeWidth={1.9} /> : isSingleMode ? <Volume2 size={16} strokeWidth={1.9} /> : <Download size={16} strokeWidth={1.9} />}
            {isBusy ? (bulkExport.isExporting ? "Exporting zip" : "Generating") : isSingleMode ? "Generate audio" : "Generate zip"}
          </button>
          {isBusy ? (
            <button type="button" className="ghost-pill" onClick={handleCancel}>
              <X size={15} strokeWidth={1.8} />
              Cancel
            </button>
          ) : null}
        </div>

        <StatusPanel
          message={statusMessage}
          progress={bulkExport.isExporting ? bulkExport.progress : undefined}
          warnings={mergedWarnings}
          error={mergedError}
        />
        {isSingleMode ? <AudioPlayer result={singleAudioResultSignal.value} /> : null}
      </section>
    </main>
  );
}
