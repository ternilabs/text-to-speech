import { describe, expect, it } from "vitest";
import { createUniqueFilenameStems, sanitizeFilenameStem } from "@/features/bulk/filename";

describe("sanitizeFilenameStem", () => {
  it("replaces invalid filename characters", () => {
    expect(sanitizeFilenameStem('bad/file\\name:*?"<>|', "fallback")).toBe("bad-file-name");
  });

  it("trims and collapses whitespace", () => {
    expect(sanitizeFilenameStem("  intro   voice  ", "fallback")).toBe("intro-voice");
  });

  it("uses fallback when the stem is empty", () => {
    expect(sanitizeFilenameStem("   ///   ", "row-0001")).toBe("row-0001");
  });
});

describe("createUniqueFilenameStems", () => {
  it("deduplicates filename collisions with numeric suffixes", () => {
    expect(
      createUniqueFilenameStems([
        { id: "intro" },
        { id: "intro" },
        { id: "intro-2" },
        { id: "intro" },
      ]),
    ).toEqual(["intro", "intro-2", "intro-2-2", "intro-3"]);
  });

  it("uses row fallback ids for empty rows", () => {
    expect(createUniqueFilenameStems([{ id: "" }, { id: "" }])).toEqual(["row-0001", "row-0002"]);
  });
});
