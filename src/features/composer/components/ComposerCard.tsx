import { bulkParseErrorSignal } from "@/features/tts/signals";
import { ComposerActions } from "./ComposerActions";
import { ComposerInput } from "./ComposerInput";
import { ComposerSettingsDropdown } from "./ComposerSettingsDropdown";
import { ModelDropdown } from "./ModelDropdown";

type ComposerCardProps = {
  isSingleMode: boolean;
  isBusy: boolean;
  isBulkExporting: boolean;
  isModelLoading: boolean;
  canGenerate: boolean;
  onGenerate(): void;
  onCancel(): void;
};

export function ComposerCard({
  isSingleMode,
  isBusy,
  isBulkExporting,
  isModelLoading,
  canGenerate,
  onGenerate,
  onCancel,
}: ComposerCardProps) {
  return (
    <>
      <section className="composer-card" aria-label="Text to speech composer">
        <ComposerInput isBusy={isBusy} />
        <div className="divider" />
        <div className={`toolbar${isBusy ? " preview-disabled" : ""}`}>
          <ComposerSettingsDropdown disabled={isModelLoading} />
          <ModelDropdown disabled={isModelLoading} />
          <ComposerActions
            isSingleMode={isSingleMode}
            isBusy={isBusy}
            isBulkExporting={isBulkExporting}
            isModelLoading={isModelLoading}
            canGenerate={canGenerate}
            onGenerate={onGenerate}
            onCancel={onCancel}
          />
        </div>
      </section>
      {bulkParseErrorSignal.value ? (
        <div className="error-row show" role="alert">
          <span className="error-mark">!</span>
          <span>{bulkParseErrorSignal.value}</span>
        </div>
      ) : null}
    </>
  );
}
