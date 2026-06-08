import type { TtsMode, TtsStatus } from "../../tts/types";

type Progress = {
  current: number;
  total: number;
};

type StatusRowsProps = {
  mode: TtsMode;
  status: TtsStatus;
  progress?: Progress;
};

export function StatusRows({ mode, status, progress }: StatusRowsProps) {
  const isLoading = status === "loading-model";
  const isGenerating = status === "generating";
  const isExporting = status === "exporting";
  const isError = status === "error";
  const isCancelled = status === "cancelled";

  return (
    <>
      <div className={`model-loading${isLoading ? " show" : ""}`} role={isLoading ? "status" : undefined}>
        <div className="spinner" />
        <span>Loading selected model...</span>
      </div>

      <div className={`gen-row${isGenerating ? " show" : ""}`} role={isGenerating ? "status" : undefined}>
        <div className="spinner" />
        <span>Synthesizing audio...</span>
      </div>

      <div className={`gen-row${isExporting ? " show" : ""}`} role={isExporting ? "status" : undefined}>
        <div className="spinner" />
        <span>
          {progress && progress.total > 0
            ? `Synthesizing audio ${progress.current}/${progress.total}...`
            : "Synthesizing audio..."}
        </span>
      </div>

      <div className={`error-row${isError ? " show" : ""}`} role={isError ? "alert" : undefined}>
        <span className="error-mark">!</span>
        <span>
          {mode === "single"
            ? "Unable to generate audio. Check input or selected backend, then try again."
            : "Unable to export bulk audio. Check the CSV rows or selected backend, then try again."}
        </span>
      </div>

      <div className={`warning-row${isCancelled ? " show" : ""}`} role={isCancelled ? "status" : undefined}>
        <span className="warning-mark">!</span>
        <span>You have cancelled the operation.</span>
      </div>
    </>
  );
}
