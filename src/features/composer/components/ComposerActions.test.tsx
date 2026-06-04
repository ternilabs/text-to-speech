import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ComposerActions } from "./ComposerActions";

describe("ComposerActions", () => {
  it("shows loading model state and disables generate while preload is active", () => {
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

    const generateButton = screen.getByRole("button", { name: "Loading model" });

    expect(generateButton).toHaveProperty("disabled", true);
    fireEvent.click(generateButton);
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it("keeps existing single generate label when model is ready", () => {
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
});
