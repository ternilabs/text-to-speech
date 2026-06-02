import { describe, expect, it } from "vitest";
import { buildResultsManifest, type BulkRowOutcome } from "./results";

describe("buildResultsManifest", () => {
  it("returns pretty JSON with row outcomes", () => {
    const rows: BulkRowOutcome[] = [
      {
        rowIndex: 1,
        id: "intro",
        textLength: 11,
        status: "ok",
        requestedFormat: "mp3",
        outputFormat: "wav",
        filename: "intro.wav",
        warnings: ["mp3_failed_fallback_wav"],
        error: null,
      },
      {
        rowIndex: 2,
        id: "body",
        textLength: 0,
        status: "error",
        requestedFormat: "mp3",
        outputFormat: null,
        filename: null,
        warnings: [],
        error: "Unable to generate audio.",
      },
    ];

    const manifest = buildResultsManifest({
      generatedAt: "2026-06-02T00:00:00.000Z",
      formatRequested: "mp3",
      rows,
    });

    expect(manifest).toBe(`${JSON.stringify(
      {
        generatedAt: "2026-06-02T00:00:00.000Z",
        formatRequested: "mp3",
        rows,
      },
      null,
      2,
    )}\n`);
  });
});
