import { render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ComposerActions } from "./ComposerActions";

describe("ComposerActions", () => {
  it("shows loading model state", () => {
    const onGenerate = vi.fn();

    render(
      <ComposerActions
        isSingleMode
        isBusy
        isBulkExporting={false}
        isModelLoading
        canGenerate={false}
        onGenerate={onGenerate}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("shows single generate button when model is ready", () => {
    render(
      <ComposerActions
        isSingleMode
        isBusy={false}
        isBulkExporting={false}
        isModelLoading={false}
        canGenerate
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Generate audio" })).toHaveProperty("disabled", false);
  });

  it("shows bulk generate button in bulk mode", () => {
    render(
      <ComposerActions
        isSingleMode={false}
        isBusy={false}
        isBulkExporting={false}
        isModelLoading={false}
        canGenerate
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Generate bulk audio" })).toBeTruthy();
  });

  it("shows cancel button when busy", () => {
    render(
      <ComposerActions
        isSingleMode
        isBusy
        isBulkExporting={false}
        isModelLoading={false}
        canGenerate={false}
        onGenerate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });
});
