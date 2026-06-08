import { AudioCard, ComposerCard, StatusRows } from "../features/composer";
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

export function App() {
  const bulkExport = useBulkExport();
  const singleGeneration = useSingleGeneration();
  const isSingleMode = modeSignal.value === "single";
  const isModelLoading = singleGeneration.isModelLoading;
  const isBusy = singleGeneration.isGenerating || bulkExport.isExporting;
  const canGenerateSingle = singleGeneration.canGenerate && !bulkExport.isExporting;
  const canGenerateBulk = bulkRowsSignal.value.length > 0 && !isBusy;
  const mergedError = appErrorSignal.value ?? bulkExport.error;
  const isReady = statusSignal.value === "ready" && isSingleMode && singleAudioResultSignal.value;

  const handleBulkGenerate = async () => {
    if (!canGenerateBulk) return;

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
      <StatusRows
        mode={modeSignal.value}
        status={mergedError ? "error" : statusSignal.value}
      />
      {isReady ? <AudioCard result={singleAudioResultSignal.value!} /> : null}
    </AppShell>
  );
}
