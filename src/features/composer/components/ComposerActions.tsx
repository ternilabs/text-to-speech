import { Download, RefreshCw, Volume2, X } from "preact-feather";

type ComposerActionsProps = {
  isSingleMode: boolean;
  isBusy: boolean;
  isBulkExporting: boolean;
  canGenerate: boolean;
  onGenerate(): void;
  onCancel(): void;
};

export function ComposerActions({
  isSingleMode,
  isBusy,
  isBulkExporting,
  canGenerate,
  onGenerate,
  onCancel,
}: ComposerActionsProps) {
  const generateLabel = isBusy
    ? isBulkExporting
      ? "Exporting zip"
      : "Generating"
    : isSingleMode
      ? "Generate audio"
      : "Generate bulk audio";
  const idleIcon = isSingleMode ? <Volume2 size={16} strokeWidth={1.9} /> : <Download size={16} strokeWidth={1.9} />;

  return (
    <div className="composer-actions">
      <button type="button" className="primary-button" disabled={!canGenerate} onClick={onGenerate}>
        {isBusy ? <RefreshCw size={16} strokeWidth={1.9} /> : idleIcon}
        {generateLabel}
      </button>
      {isBusy ? (
        <button type="button" className="ghost-pill" onClick={onCancel}>
          <X size={15} strokeWidth={1.8} />
          Cancel
        </button>
      ) : null}
    </div>
  );
}
