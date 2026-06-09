import { fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it } from "vitest";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
  modeSignal,
  textSignal,
} from "@/features/tts/signals";
import { setBulkInputSource } from "@/features/composer/csvInput";
import { ComposerInput } from "@/features/composer/components/ComposerInput";

const queryCsvFormatNote = () =>
  screen.queryByText((_, element) =>
    Boolean(element?.classList.contains("bulk-toolbar-note") && element.textContent?.includes("CSV format")),
  );

const resetSignals = () => {
  modeSignal.value = "single";
  textSignal.value = "";
  bulkInputSourceSignal.value = "import";
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = "";
  bulkParseErrorSignal.value = null;
  bulkRowsSignal.value = [];
};

describe("ComposerInput", () => {
  beforeEach(() => {
    resetSignals();
  });

  it("renders the single text workspace and updates textSignal", () => {
    render(<ComposerInput isBusy={false} />);

    const input = screen.getByPlaceholderText("Enter text to convert to speech...") as HTMLTextAreaElement;
    fireEvent.input(input, { target: { value: "Hello from composer" } });

    expect(textSignal.value).toBe("Hello from composer");
  });

  it("shows word count and enforces 500 word limit in single mode", () => {
    render(<ComposerInput isBusy={false} />);

    const textarea = screen.getByPlaceholderText("Enter text to convert to speech...") as HTMLTextAreaElement;
    const words = Array.from({ length: 5 }, () => "word").join(" ");
    fireEvent.input(textarea, { target: { value: words } });

    expect(screen.getByText("5 / 500")).toBeTruthy();
  });

  it("truncates input at 500 words", () => {
    render(<ComposerInput isBusy={false} />);

    const textarea = screen.getByPlaceholderText("Enter text to convert to speech...") as HTMLTextAreaElement;
    const manyWords = Array.from({ length: 510 }, (_, i) => `word${i}`).join(" ");
    fireEvent.input(textarea, { target: { value: manyWords } });

    expect(textSignal.value.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(500);
    expect(screen.getByText("500 / 500")).toBeTruthy();
  });

  it("renders CSV import by default in bulk mode", () => {
    modeSignal.value = "bulk";

    render(<ComposerInput isBusy={false} />);

    expect(screen.getByText((content) => content.includes("Drop a CSV file here"))).toBeTruthy();
    expect(screen.getByText("0 / 50 rows")).toBeTruthy();
  });

  it("shows CSV format guidance in bulk import mode", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "import";

    render(<ComposerInput isBusy={false} />);

    expect(queryCsvFormatNote()).toBeTruthy();
    expect(screen.getByText("id,text")).toBeTruthy();
    expect(screen.getByText('intro,"Hello from TerniLabs"')).toBeTruthy();
  });

  it("shows CSV format guidance in bulk paste mode", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "paste";

    render(<ComposerInput isBusy={false} />);

    expect(queryCsvFormatNote()).toBeTruthy();
    expect(screen.getByText("id,text")).toBeTruthy();
    expect(screen.getByText('intro,"Hello from TerniLabs"')).toBeTruthy();
  });

  it("does not show CSV format guidance in single mode", () => {
    render(<ComposerInput isBusy={false} />);

    expect(queryCsvFormatNote()).toBeNull();
    expect(screen.queryByText("id,text")).toBeNull();
  });

  it("shows imported CSV summary state", () => {
    modeSignal.value = "bulk";
    bulkFileNameSignal.value = "clips.csv";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello" }];
    bulkParseErrorSignal.value = "CSV warning";

    render(<ComposerInput isBusy={false} />);

    expect(screen.getByText((content) => content.includes("You have selected filename clips.csv"))).toBeTruthy();
    expect(screen.getByText("1 / 50 rows")).toBeTruthy();
  });

  it("renders pasted CSV input when import is disabled", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "paste";

    render(<ComposerInput isBusy={false} />);

    const input = screen.getByPlaceholderText("Paste CSV rows with id,text columns...") as HTMLTextAreaElement;
    fireEvent.input(input, { target: { value: "id,text\nintro,Hello" } });

    expect(bulkCsvTextSignal.value).toBe("id,text\nintro,Hello");
    expect(bulkRowsSignal.value).toEqual([{ rowIndex: 1, id: "intro", text: "Hello" }]);
    expect(bulkParseErrorSignal.value).toBeNull();
  });

  it("renders a clean paste input after switching away from imported CSV state", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "import";
    bulkFileNameSignal.value = "clips.csv";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello world" }];
    bulkParseErrorSignal.value = "Old import warning";

    setBulkInputSource("paste");
    render(<ComposerInput isBusy={false} />);

    expect(screen.getByPlaceholderText("Paste CSV rows with id,text columns...")).toBeTruthy();
    expect(screen.getByText("0 / 50 rows")).toBeTruthy();
    expect(screen.queryByText("clips.csv")).toBeNull();
    expect(screen.queryByText("Old import warning")).toBeNull();
  });

  it("renders a clean import dropzone after switching away from pasted CSV state", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "paste";
    bulkCsvTextSignal.value = "id,text\nintro,Hello world";
    bulkFileNameSignal.value = "Pasted CSV";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello world" }];
    bulkParseErrorSignal.value = "Old paste warning";

    setBulkInputSource("import");
    render(<ComposerInput isBusy={false} />);

    expect(screen.getByText((content) => content.includes("Drop a CSV file here"))).toBeTruthy();
    expect(screen.getByText("0 / 50 rows")).toBeTruthy();
    expect(screen.queryByText("Pasted CSV")).toBeNull();
    expect(screen.queryByText("Old paste warning")).toBeNull();
  });
});
