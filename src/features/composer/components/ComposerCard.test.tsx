import { render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
  modeSignal,
  settingsOpenSignal,
  textSignal,
} from "../../tts/signals";
import { ComposerCard } from "./ComposerCard";

const resetSignals = () => {
  modeSignal.value = "single";
  textSignal.value = "";
  bulkInputSourceSignal.value = "import";
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = "";
  bulkParseErrorSignal.value = null;
  bulkRowsSignal.value = [];
  settingsOpenSignal.value = false;
};

describe("ComposerCard", () => {
  beforeEach(() => {
    resetSignals();
  });

  it("locks composer footer controls while the model is loading", () => {
    render(
      <ComposerCard
        isSingleMode
        isBusy
        isBulkExporting={false}
        isModelLoading
        canGenerate={false}
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Model")).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Loading model" })).toHaveProperty("disabled", true);
  });

  it("leaves composer footer controls usable when the model is ready", () => {
    render(
      <ComposerCard
        isSingleMode
        isBusy={false}
        isBulkExporting={false}
        isModelLoading={false}
        canGenerate
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toHaveProperty("disabled", false);
    expect(screen.getByLabelText("Model")).toHaveProperty("disabled", false);
    expect(screen.getByRole("button", { name: "Generate audio" })).toHaveProperty("disabled", false);
  });
});
