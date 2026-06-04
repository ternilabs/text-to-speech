import { ComposerCard, ComposerStatePanel } from "../features/composer";
import { useBulkExport } from "../features/bulk/useBulkExport";
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
} from "../features/tts/signals";
import { AppShell } from "./AppShell";
import { useSingleGeneration } from "./useSingleGeneration";

const formatWarning = (warning: string) => {
  if (warning === "mp3_failed_fallback_wav") {
    return "MP3 failed validation. WAV fallback was used.";
  }
  return warning;
};

export function App() {
  const bulkExport = useBulkExport();
  const singleGeneration = useSingleGeneration();
  const isSingleMode = modeSignal.value === "single";
  const isModelLoading = singleGeneration.isModelLoading;
  const isBusy = singleGeneration.isGenerating || bulkExport.isExporting;
  const canGenerateSingle = singleGeneration.canGenerate && !bulkExport.isExporting;
  const canGenerateBulk = bulkRowsSignal.value.length > 0 && !isBusy;
  const mergedWarnings = [
    ...appWarningsSignal.value,
    ...bulkExport.warnings,
    ...(singleAudioResultSignal.value?.warnings ?? []),
  ];
  const uniqueWarnings = Array.from(new Set(mergedWarnings.map(formatWarning)));
  const mergedError = appErrorSignal.value ?? bulkExport.error;
  const statusMessage = bulkExport.isExporting
    ? `Exporting zip (${bulkExport.progress.current}/${bulkExport.progress.total})`
    : statusMessageSignal.value;

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

    singleGeneration.cancel();
  };

  return (
    <AppShell>
      <ComposerCard
        isSingleMode={isSingleMode}
        isBusy={isBusy}
        isBulkExporting={bulkExport.isExporting}
        isModelLoading={isModelLoading}
        canGenerate={isSingleMode ? canGenerateSingle : canGenerateBulk}
        onGenerate={isSingleMode ? singleGeneration.generate : handleBulkGenerate}
        onCancel={handleCancel}
      />
      <ComposerStatePanel
        mode={modeSignal.value}
        status={statusSignal.value}
        message={statusMessage}
        progress={bulkExport.isExporting ? bulkExport.progress : undefined}
        warnings={uniqueWarnings}
        error={mergedError}
        result={singleAudioResultSignal.value}
      />
    </AppShell>
  );
}
