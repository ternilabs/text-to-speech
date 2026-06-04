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
    <section className="composer-card" aria-label="Text to speech composer">
      <div className="composer-input-zone">
        <ComposerInput />
        <div className="composer-footer">
          <div className="composer-footer-left">
            <ComposerSettingsDropdown disabled={isModelLoading} />
          </div>
          <div className="composer-footer-right">
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
        </div>
      </div>
    </section>
  );
}
