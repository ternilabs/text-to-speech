import { beforeEach, describe, expect, it } from "vitest";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
} from "@/features/tts/signals";
import { applyBulkCsvFileText, applyBulkCsvText, clearBulkCsvInput, setBulkInputSource } from "@/features/composer/csvInput";

const resetBulkSignals = () => {
  bulkInputSourceSignal.value = "import";
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = "";
  bulkParseErrorSignal.value = null;
  bulkRowsSignal.value = [];
};

describe("composer csv input", () => {
  beforeEach(() => {
    resetBulkSignals();
  });

  it("parses pasted CSV into the shared bulk row signal", () => {
    applyBulkCsvText("id,text\nintro,Hello world");

    expect(bulkInputSourceSignal.value).toBe("paste");
    expect(bulkCsvTextSignal.value).toBe("id,text\nintro,Hello world");
    expect(bulkFileNameSignal.value).toBe("Pasted CSV");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([{ rowIndex: 1, id: "intro", text: "Hello world" }]);
  });

  it("clears rows and records parser errors for invalid pasted CSV", () => {
    applyBulkCsvText("id,title\nintro,Missing text");

    expect(bulkRowsSignal.value).toEqual([]);
    expect(bulkParseErrorSignal.value).toBe("CSV must include a header row with a text column.");
  });

  it("records an empty-row error when pasted CSV has headers but no usable text", () => {
    applyBulkCsvText("id,text\nempty,");

    expect(bulkRowsSignal.value).toEqual([]);
    expect(bulkParseErrorSignal.value).toBe("CSV did not contain any valid text rows.");
  });

  it("parses imported file text and clears pasted CSV state", () => {
    applyBulkCsvText("id,text\nintro,Hello world");
    applyBulkCsvFileText("clips.csv", "id,text\nbody,Read this");

    expect(bulkInputSourceSignal.value).toBe("import");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("clips.csv");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([{ rowIndex: 1, id: "body", text: "Read this" }]);
  });

  it("clears pasted CSV state without changing the selected input source", () => {
    applyBulkCsvText("id,text\nintro,Hello world");
    clearBulkCsvInput();

    expect(bulkInputSourceSignal.value).toBe("paste");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([]);
  });

  it("clears stale imported CSV state when switching to pasted CSV input", () => {
    applyBulkCsvFileText("clips.csv", "id,text\nintro,Hello world");

    setBulkInputSource("paste");

    expect(bulkInputSourceSignal.value).toBe("paste");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([]);
  });

  it("clears stale pasted CSV state when switching to imported CSV input", () => {
    applyBulkCsvText("id,title\nintro,Missing text");

    setBulkInputSource("import");

    expect(bulkInputSourceSignal.value).toBe("import");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([]);
  });

  it("preserves active CSV state when setting the current source again", () => {
    applyBulkCsvFileText("clips.csv", "id,text\nintro,Hello world");

    setBulkInputSource("import");

    expect(bulkInputSourceSignal.value).toBe("import");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("clips.csv");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([{ rowIndex: 1, id: "intro", text: "Hello world" }]);
  });
});
