import type { OutputFormat } from "@/features/tts/types";

export type BulkRowOutcome = {
  rowIndex: number;
  id: string;
  textLength: number;
  status: "ok" | "error";
  requestedFormat: OutputFormat;
  outputFormat: OutputFormat | null;
  filename: string | null;
  warnings: string[];
  error: string | null;
};

export type ResultsManifestInput = {
  generatedAt: string;
  formatRequested: OutputFormat;
  rows: BulkRowOutcome[];
};

export function buildResultsManifest(input: ResultsManifestInput): string {
  return `${JSON.stringify(input, null, 2)}\n`;
}
