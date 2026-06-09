import { useState } from "preact/hooks";
import { Upload } from "preact-feather";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkRowsSignal,
  modeSignal,
  textSignal,
} from "@/features/tts/signals";
import { applyBulkCsvFileText, applyBulkCsvText } from "@/features/composer/csvInput";

const MAX_WORDS = 500;

const countWords = (value: string) => {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
};

const limitWords = (value: string, maxWords: number) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") : value;
};

const readCsvFile = async (file: File) => {
  try {
    applyBulkCsvFileText(file.name, await file.text());
  } catch {
    bulkRowsSignal.value = [];
    bulkFileNameSignal.value = file.name;
  }
};

function BulkCsvFormatNote() {
  return (
    <p className="bulk-toolbar-note">
      CSV format: <code>id,text</code> · Example: <code>intro,"Hello from TerniLabs"</code>
    </p>
  );
}

type ComposerInputProps = {
  isBusy: boolean;
};

export function ComposerInput({ isBusy }: ComposerInputProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const isBulkMode = modeSignal.value === "bulk";
  const isImportMode = bulkInputSourceSignal.value === "import";
  const rowCount = bulkRowsSignal.value.length;

  if (!isBulkMode) {
    const wordCount = countWords(textSignal.value);

    return (
      <section id="single-panel" className="composer-input-pane" role="tabpanel">
        <textarea
          className="composer-textarea"
          value={textSignal.value}
          placeholder="Enter text to convert to speech..."
          rows={6}
          disabled={isBusy}
          onInput={(event) => {
            const raw = (event.currentTarget as HTMLTextAreaElement).value;
            const limited = limitWords(raw, MAX_WORDS);
            if (limited !== raw) {
              textSignal.value = limited;
              event.currentTarget.value = limited;
            } else {
              textSignal.value = raw;
            }
          }}
        />
        <div className="char-row">
          <span className="char-count">{wordCount} / {MAX_WORDS}</span>
        </div>
      </section>
    );
  }

  if (!isImportMode) {
    return (
      <section id="bulk-panel" className="composer-input-pane" role="tabpanel">
        <textarea
          className="composer-textarea composer-textarea--csv"
          value={bulkCsvTextSignal.value}
          placeholder="Paste CSV rows with id,text columns..."
          rows={6}
          disabled={isBusy}
          onInput={(event) => {
            applyBulkCsvText((event.currentTarget as HTMLTextAreaElement).value);
          }}
        />
        <div className="bulk-meta-row">
          <BulkCsvFormatNote />
          <span className="char-count">{rowCount} / 50 rows</span>
        </div>
      </section>
    );
  }

  return (
    <section
      id="bulk-panel"
      className="composer-input-pane"
      role="tabpanel"
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        const file = event.dataTransfer?.files[0];
        if (file) {
          void readCsvFile(file);
        }
      }}
    >
      <div
        className={`upload-zone${isDragActive ? " composer-dropzone--active" : ""}${isBusy ? " control-disabled" : ""}`}
        onClick={() => {
          if (isBusy) return;
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,text/csv";
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) void readCsvFile(file);
          };
          input.click();
        }}
      >
        <Upload size={22} strokeWidth={1.5} />
        {rowCount > 0 ? (
          <>
            <div className="uz-label">You have selected filename {bulkFileNameSignal.value}</div>
            <div className="uz-sub">Drag and drop a CSV file, or choose another file from your device.</div>
          </>
        ) : (
          <div className="uz-label">Drop a CSV file here, or click to browse</div>
        )}
      </div>
      <div className="bulk-meta-row">
        <BulkCsvFormatNote />
        <span className="char-count">{rowCount} / 50 rows</span>
      </div>
    </section>
  );
}
