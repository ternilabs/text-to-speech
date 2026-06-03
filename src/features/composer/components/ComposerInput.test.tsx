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
import { ComposerInput } from "./ComposerInput";

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
    expect(screen.getByText("No file selected")).toBeTruthy();
    expect(screen.getByText("0 rows loaded")).toBeTruthy();
  });

  it("shows imported CSV summary state", () => {
    modeSignal.value = "bulk";
    bulkFileNameSignal.value = "clips.csv";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello" }];
    bulkParseErrorSignal.value = "CSV warning";

    render(<ComposerInput />);

    expect(screen.getByText("clips.csv")).toBeTruthy();
    expect(screen.getByText("1 rows loaded")).toBeTruthy();
    expect(screen.getByText("CSV warning")).toBeTruthy();
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
});
