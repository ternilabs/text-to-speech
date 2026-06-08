import { X, Volume2, Download, RefreshCw } from "preact-feather";

type ComposerActionsProps = {
  isSingleMode: boolean;
  isBusy: boolean;
  isBulkExporting: boolean;
  isModelLoading?: boolean;
  canGenerate: boolean;
  onGenerate(): void;
  onCancel(): void;
};

export function ComposerActions({
  isSingleMode,
  isBusy,
  isBulkExporting,
  isModelLoading = false,
  canGenerate,
  onGenerate,
  onCancel,
}: ComposerActionsProps) {
  const generateLabel = isModelLoading
    ? "Loading model"
    : isBusy
      ? isBulkExporting
        ? "Exporting zip"
        : "Generating"
      : isSingleMode
        ? "Generate audio"
        : "Generate bulk audio";

  const idleIcon = isSingleMode ? <Volume2 size={16} strokeWidth={1.9} /> : <Download size={16} strokeWidth={1.9} />;

  if (isBusy) {
    return (
      <div className="composer-actions">
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          <X size={15} strokeWidth={1.8} />
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="composer-actions">
      <button
        type="button"
        className="btn btn-primary gen-btn"
        disabled={!canGenerate}
        onClick={() => {
          if (canGenerate) onGenerate();
        }}
      >
        {isModelLoading ? <RefreshCw size={16} strokeWidth={1.9} /> : idleIcon}
        {generateLabel}
      </button>
    </div>
  );
}
