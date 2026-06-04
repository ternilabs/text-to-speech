import { describe, expect, it } from "vitest";
import { parseCsvToBulkRows } from "./csv";

describe("parseCsvToBulkRows", () => {
  it("parses id and text columns", () => {
    const result = parseCsvToBulkRows("id,text\nintro,Hello world");

    expect(result).toEqual({
      rows: [{ rowIndex: 1, id: "intro", text: "Hello world" }],
      hasHeader: true,
    });
  });

  it("accepts the Bulk CSV format note example", () => {
    const result = parseCsvToBulkRows('id,text\nintro,"Hello from TerniLabs"');

    expect(result).toEqual({
      rows: [{ rowIndex: 1, id: "intro", text: "Hello from TerniLabs" }],
      hasHeader: true,
    });
  });

  it("parses quoted commas and quoted line breaks", () => {
    const result = parseCsvToBulkRows('id,text\nintro,"Hello, world"\nbody,"Line one\nLine two"');

    expect(result.rows).toEqual([
      { rowIndex: 1, id: "intro", text: "Hello, world" },
      { rowIndex: 2, id: "body", text: "Line one\nLine two" },
    ]);
  });

  it("accepts filename and paragraph aliases", () => {
    const result = parseCsvToBulkRows("filename,paragraph\nclip-1,Read this");

    expect(result.rows).toEqual([{ rowIndex: 1, id: "clip-1", text: "Read this" }]);
  });

  it("skips empty text rows", () => {
    const result = parseCsvToBulkRows("id,text\nempty,\nvalid,Keep this");

    expect(result.rows).toEqual([{ rowIndex: 1, id: "valid", text: "Keep this" }]);
  });

  it("generates row ids when id values are empty", () => {
    const result = parseCsvToBulkRows("id,text\n,First\n,Second");

    expect(result.rows).toEqual([
      { rowIndex: 1, id: "row-0001", text: "First" },
      { rowIndex: 2, id: "row-0002", text: "Second" },
    ]);
  });

  it("returns an error when no text-like column exists", () => {
    const result = parseCsvToBulkRows("id,title\nintro,Missing text");

    expect(result).toEqual({
      rows: [],
      hasHeader: false,
      error: "CSV must include a header row with a text column.",
    });
  });
});
