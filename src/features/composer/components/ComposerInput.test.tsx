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
} from "../../tts/signals";
import { setBulkInputSource } from "../csvInput";
import { ComposerInput } from "./ComposerInput";

const CSV_FORMAT_NOTE_TEXT = 'CSV format: id,text · Example: intro,"Hello from TerniLabs"';

const queryCsvFormatNote = () =>
  screen.queryByText((_, element) =>
    Boolean(element?.classList.contains("composer-help-note") && element.textContent === CSV_FORMAT_NOTE_TEXT),
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
    render(<ComposerInput />);

    const input = screen.getByPlaceholderText("Enter text to speak...") as HTMLTextAreaElement;
    fireEvent.input(input, { target: { value: "Hello from composer" } });

    expect(textSignal.value).toBe("Hello from composer");
  });

  it("renders CSV import by default in bulk mode", () => {
    modeSignal.value = "bulk";

    render(<ComposerInput />);

    expect(screen.getByText("Drop CSV file here")).toBeTruthy();
    expect(screen.getByText("No CSV loaded yet")).toBeTruthy();
    expect(screen.getByText("0 rows loaded")).toBeTruthy();
  });

  it("shows CSV format guidance in bulk import mode", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "import";

    render(<ComposerInput />);

    expect(queryCsvFormatNote()).toBeTruthy();
    expect(screen.getByText("id,text")).toBeTruthy();
    expect(screen.getByText('intro,"Hello from TerniLabs"')).toBeTruthy();
  });

  it("shows CSV format guidance in bulk paste mode", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "paste";

    render(<ComposerInput />);

    expect(queryCsvFormatNote()).toBeTruthy();
    expect(screen.getByText("id,text")).toBeTruthy();
    expect(screen.getByText('intro,"Hello from TerniLabs"')).toBeTruthy();
  });

  it("does not show CSV format guidance in single mode", () => {
    render(<ComposerInput />);

    expect(queryCsvFormatNote()).toBeNull();
    expect(screen.queryByText("id,text")).toBeNull();
    expect(screen.queryByText('intro,"Hello from TerniLabs"')).toBeNull();
  });

  it("shows imported CSV summary state", () => {
    modeSignal.value = "bulk";
    bulkFileNameSignal.value = "clips.csv";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello" }];
    bulkParseErrorSignal.value = "CSV warning";

    render(<ComposerInput />);

    expect(screen.getByText("clips.csv")).toBeTruthy();
    expect(screen.getByText("1 row loaded")).toBeTruthy();
    expect(screen.getByText("CSV warning")).toBeTruthy();
  });

  it("uses singular row-count copy for one imported row", () => {
    modeSignal.value = "bulk";
    bulkFileNameSignal.value = "clips.csv";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello" }];

    render(<ComposerInput />);

    expect(screen.getByText("clips.csv")).toBeTruthy();
    expect(screen.getByText("1 row loaded")).toBeTruthy();
  });

  it("renders pasted CSV input when import is disabled", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "paste";

    render(<ComposerInput />);

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
    render(<ComposerInput />);

    expect(screen.getByPlaceholderText("Paste CSV rows with id,text columns...")).toBeTruthy();
    expect(screen.getByText("0 rows loaded")).toBeTruthy();
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
    render(<ComposerInput />);

    expect(screen.getByText("Drop CSV file here")).toBeTruthy();
    expect(screen.getByText("No CSV loaded yet")).toBeTruthy();
    expect(screen.getByText("0 rows loaded")).toBeTruthy();
    expect(screen.queryByText("Pasted CSV")).toBeNull();
    expect(screen.queryByText("Old paste warning")).toBeNull();
  });
});
