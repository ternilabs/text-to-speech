import { useState } from "preact/hooks";
import { Upload } from "preact-feather";
import { parseCsvToBulkRows } from "../csv";
import {
  bulkFileNameSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
} from "../../tts/signals";

const readCsvFile = async (file: File) => {
  bulkFileNameSignal.value = file.name;
  bulkParseErrorSignal.value = null;

  try {
    const result = parseCsvToBulkRows(await file.text());
    bulkRowsSignal.value = result.rows;
    bulkParseErrorSignal.value =
      result.error ?? (result.rows.length === 0 ? "CSV did not contain any valid text rows." : null);
  } catch {
    bulkRowsSignal.value = [];
    bulkParseErrorSignal.value = "Failed to read CSV. Please check the file and try again.";
  }
};

export function CsvDropzone() {
  const [isDragActive, setIsDragActive] = useState(false);
  const rowCount = bulkRowsSignal.value.length;

  return (
    <div
      id="bulk-panel"
      className={`csv-dropzone${isDragActive ? " csv-dropzone--active" : ""}`}
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
      <div>
        <label className="upload-label">
          Upload CSV
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
        <p className="helper-text">CSV columns: id,text</p>
      </div>
      <div className="csv-summary">
        {bulkFileNameSignal.value ? <span>{bulkFileNameSignal.value}</span> : <span>No file selected</span>}
        <strong>{rowCount} rows loaded</strong>
        {bulkParseErrorSignal.value ? <em>{bulkParseErrorSignal.value}</em> : null}
      </div>
    </div>
  );
}
