import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { ComposerStatePanel } from "./ComposerStatePanel";

describe("ComposerStatePanel", () => {
  it("shows loading-model as a visible working status", () => {
    render(
      <ComposerStatePanel
        mode="single"
        status="loading-model"
        message="Loading Kokoro model"
        warnings={[]}
        error={null}
        result={null}
      />,
    );

    expect(screen.getByText("Loading Kokoro model")).toBeTruthy();
    expect(document.querySelector(".composer-state-panel--working")).toBeTruthy();
  });
});
