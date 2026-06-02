export type BulkRow = {
  rowIndex: number;
  id: string;
  text: string;
};

export type BulkParseResult = {
  rows: BulkRow[];
  hasHeader: boolean;
  error?: string;
};

const ID_ALIASES = ["id", "name", "filename"];
const TEXT_ALIASES = ["text", "paragraph", "content"];

const normalizeHeader = (value: string) => value.trim().toLowerCase();

const buildGeneratedId = (index: number) => `row-${index.toString().padStart(4, "0")}`;

const splitCsvRows = (input: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (char === "\"") {
      if (inQuotes && input[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      row.push(current);
      current = "";
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
};

const findHeaderIndex = (headers: string[], aliases: string[]) =>
  headers.findIndex((header) => aliases.includes(header));

export const parseCsvToBulkRows = (input: string): BulkParseResult => {
  const sanitized = input.replace(/^\uFEFF/, "").trim();
  if (!sanitized) {
    return { rows: [], hasHeader: false };
  }

  const csvRows = splitCsvRows(sanitized);
  if (csvRows.length === 0) {
    return { rows: [], hasHeader: false };
  }

  const headers = csvRows[0].map(normalizeHeader);
  const idIndex = findHeaderIndex(headers, ID_ALIASES);
  const textIndex = findHeaderIndex(headers, TEXT_ALIASES);

  if (textIndex === -1) {
    return {
      rows: [],
      hasHeader: false,
      error: "CSV must include a header row with a text column.",
    };
  }

  if (idIndex === -1) {
    return {
      rows: [],
      hasHeader: false,
      error: "CSV must include a header row with an id column.",
    };
  }

  const rows: BulkRow[] = [];

  for (let index = 1; index < csvRows.length; index += 1) {
    const csvRow = csvRows[index];
    const text = (csvRow[textIndex] ?? "").trim();

    if (!text) {
      continue;
    }

    const rowIndex = rows.length + 1;
    const id = (csvRow[idIndex] ?? "").trim() || buildGeneratedId(rowIndex);

    rows.push({ rowIndex, id, text });
  }

  return { rows, hasHeader: true };
};
