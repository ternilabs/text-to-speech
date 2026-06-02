import { Download, RefreshCw, Volume2, X } from "preact-feather";
import { CsvDropzone } from "../features/bulk/components/CsvDropzone";
import { useBulkExport } from "../features/bulk/useBulkExport";
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
} from "../features/tts/signals";
import { AppShell } from "./AppShell";
import { GenerationCard } from "./GenerationCard";
import { useSingleGeneration } from "./useSingleGeneration";

const getStatusTone = () => {
  if (
    statusSignal.value === "loading-model" ||
    statusSignal.value === "generating" ||
    statusSignal.value === "exporting"
  ) {
    return "working";
  }
  if (statusSignal.value === "ready") {
    return "success";
  }
  if (statusSignal.value === "cancelled") {
    return "warning";
  }
  if (statusSignal.value === "error") {
    return "error";
  }
  return "neutral";
};

export function App() {
  const bulkExport = useBulkExport();
  const singleGeneration = useSingleGeneration();
  const isSingleMode = modeSignal.value === "single";
  const isBusy = singleGeneration.isGenerating || bulkExport.isExporting;
  const canGenerateSingle = singleGeneration.canGenerate && !bulkExport.isExporting;
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
      <GenerationCard>
        <div className="mode-toggle" role="tablist" aria-label="Generation mode">
          <button
            type="button"
            role="tab"
            aria-selected={isSingleMode}
            aria-controls="single-panel"
            className={isSingleMode ? "active" : ""}
            onClick={() => {
              modeSignal.value = "single";
            }}
          >
            Single
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSingleMode}
            aria-controls="bulk-panel"
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
            onClick={isSingleMode ? singleGeneration.generate : handleBulkGenerate}
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
          tone={getStatusTone()}
          progress={bulkExport.isExporting ? bulkExport.progress : undefined}
          warnings={mergedWarnings}
          error={mergedError}
        />
        {isSingleMode ? <AudioPlayer result={singleAudioResultSignal.value} /> : null}
      </GenerationCard>
    </AppShell>
  );
}
