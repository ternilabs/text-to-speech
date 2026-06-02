const INVALID_FILENAME_CHARS = /[\/\\:*?"<>|]+/g;
const SEPARATORS = /[\s_-]+/g;

const buildFallback = (index: number) => `row-${index.toString().padStart(4, "0")}`;

export function sanitizeFilenameStem(value: string, fallback: string): string {
  const sanitized = value
    .trim()
    .replace(INVALID_FILENAME_CHARS, "-")
    .replace(SEPARATORS, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || fallback;
}

export function createUniqueFilenameStems(rows: { id: string }[]): string[] {
  const seen = new Set<string>();

  return rows.map((row, index) => {
    const fallback = buildFallback(index + 1);
    const baseStem = sanitizeFilenameStem(row.id, fallback);
    let stem = baseStem;
    let suffix = 2;

    while (seen.has(stem)) {
      stem = `${baseStem}-${suffix}`;
      suffix += 1;
    }

    seen.add(stem);
    return stem;
  });
}
