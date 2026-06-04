import { useState } from "preact/hooks";
import { Upload } from "preact-feather";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
  modeSignal,
  textSignal,
} from "../../tts/signals";
import { applyBulkCsvFileText, applyBulkCsvText } from "../csvInput";

const readCsvFile = async (file: File) => {
  bulkParseErrorSignal.value = null;

  try {
    applyBulkCsvFileText(file.name, await file.text());
  } catch {
    bulkRowsSignal.value = [];
    bulkFileNameSignal.value = file.name;
    bulkParseErrorSignal.value = "Failed to read CSV. Please check the file and try again.";
  }
};

function BulkCsvFormatNote() {
  return (
    <p className="composer-help-note">
      CSV format: <code>id,text</code> · Example: <code>intro,"Hello from TerniLabs"</code>
    </p>
  );
}

const formatLoadedRows = (rowCount: number) => `${rowCount} ${rowCount === 1 ? "row" : "rows"} loaded`;

export function ComposerInput() {
  const [isDragActive, setIsDragActive] = useState(false);
  const isBulkMode = modeSignal.value === "bulk";
  const isImportMode = bulkInputSourceSignal.value === "import";
  const rowCount = bulkRowsSignal.value.length;

  if (!isBulkMode) {
    return (
      <section id="single-panel" className="composer-input-pane" role="tabpanel">
        <textarea
          className="composer-textarea"
          value={textSignal.value}
          placeholder="Enter text to speak..."
          rows={6}
          onInput={(event) => {
            textSignal.value = (event.currentTarget as HTMLTextAreaElement).value;
          }}
        />
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
          onInput={(event) => {
            applyBulkCsvText((event.currentTarget as HTMLTextAreaElement).value);
          }}
        />
        <BulkCsvFormatNote />
        <div className="composer-input-summary" aria-live="polite">
          <strong>{formatLoadedRows(rowCount)}</strong>
          {bulkParseErrorSignal.value ? <em>{bulkParseErrorSignal.value}</em> : null}
        </div>
      </section>
    );
  }

  return (
    <section
      id="bulk-panel"
      className={`composer-dropzone${isDragActive ? " composer-dropzone--active" : ""}`}
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
      <Upload size={20} strokeWidth={1.8} />
      <div className="composer-drop-copy">
        <strong>Drop CSV file here</strong>
        <span>Drag and drop a CSV file, or choose a file from your device.</span>
        <BulkCsvFormatNote />
        <label className="upload-label">
          Open file
          <input
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = (event.currentTarget as HTMLInputElement).files?.[0];
              if (file) {
                void readCsvFile(file);
              }
            }}
          />
        </label>
      </div>
      <div className="composer-input-summary" aria-live="polite">
        {bulkFileNameSignal.value ? <span>{bulkFileNameSignal.value}</span> : <span>No CSV loaded yet</span>}
        <strong>{formatLoadedRows(rowCount)}</strong>
        {bulkParseErrorSignal.value ? <em>{bulkParseErrorSignal.value}</em> : null}
      </div>
    </section>
  );
}
