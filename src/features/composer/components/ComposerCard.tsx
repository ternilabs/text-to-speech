import { ComposerActions } from "./ComposerActions";
import { ComposerInput } from "./ComposerInput";
import { ComposerSettingsDropdown } from "./ComposerSettingsDropdown";
import { ModelDropdown } from "./ModelDropdown";

type ComposerCardProps = {
  isSingleMode: boolean;
  isBusy: boolean;
  isBulkExporting: boolean;
  canGenerate: boolean;
  onGenerate(): void;
  onCancel(): void;
};

export function ComposerCard({ isSingleMode, isBusy, isBulkExporting, canGenerate, onGenerate, onCancel }: ComposerCardProps) {
  return (
    <section className="composer-card" aria-label="Text to speech composer">
      <div className="composer-input-zone">
        <ComposerInput />
        <div className="composer-footer">
          <div className="composer-footer-left">
            <ComposerSettingsDropdown />
          </div>
          <div className="composer-footer-right">
            <ModelDropdown />
            <ComposerActions
              isSingleMode={isSingleMode}
              isBusy={isBusy}
              isBulkExporting={isBulkExporting}
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
