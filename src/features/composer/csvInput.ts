import { parseCsvToBulkRows } from "../bulk/csv";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
} from "../tts/signals";
import type { BulkInputSource } from "../tts/types";

const EMPTY_ROWS_ERROR = "CSV did not contain any valid text rows.";

const getEmptyRowsError = (input: string) => (input.trim().length > 0 ? EMPTY_ROWS_ERROR : null);

export const setBulkInputSource = (source: BulkInputSource) => {
  if (bulkInputSourceSignal.value === source) return;

  bulkInputSourceSignal.value = source;
  clearBulkCsvInput();
};

export const applyBulkCsvText = (input: string) => {
  bulkInputSourceSignal.value = "paste";
  bulkCsvTextSignal.value = input;
  bulkFileNameSignal.value = input.trim().length > 0 ? "Pasted CSV" : "";

  const result = parseCsvToBulkRows(input);
  bulkRowsSignal.value = result.rows;
  bulkParseErrorSignal.value = result.error ?? (result.rows.length === 0 ? getEmptyRowsError(input) : null);

  return result;
};

export const applyBulkCsvFileText = (filename: string, input: string) => {
  bulkInputSourceSignal.value = "import";
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = filename;

  const result = parseCsvToBulkRows(input);
  bulkRowsSignal.value = result.rows;
  bulkParseErrorSignal.value = result.error ?? (result.rows.length === 0 ? EMPTY_ROWS_ERROR : null);

  return result;
};

export const clearBulkCsvInput = () => {
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = "";
  bulkParseErrorSignal.value = null;
  bulkRowsSignal.value = [];
};
