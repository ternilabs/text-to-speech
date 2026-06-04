import { fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it } from "vitest";
import {
  bulkCsvTextSignal,
  bulkFileNameSignal,
  bulkInputSourceSignal,
  bulkParseErrorSignal,
  bulkRowsSignal,
  deviceSignal,
  modeSignal,
  outputFormatSignal,
  selectedVoiceSignal,
  settingsOpenSignal,
  speedSignal,
} from "../../tts/signals";
import { ComposerSettingsDropdown } from "./ComposerSettingsDropdown";
import { ModelDropdown } from "./ModelDropdown";

const resetSignals = () => {
  modeSignal.value = "single";
  bulkInputSourceSignal.value = "import";
  bulkCsvTextSignal.value = "";
  bulkFileNameSignal.value = "";
  bulkParseErrorSignal.value = null;
  bulkRowsSignal.value = [];
  selectedVoiceSignal.value = "af_heart";
  outputFormatSignal.value = "wav";
  deviceSignal.value = "wasm";
  speedSignal.value = 1;
  settingsOpenSignal.value = false;
};

describe("ComposerSettingsDropdown", () => {
  beforeEach(() => {
    resetSignals();
  });

  it("opens settings and updates mode plus import source", () => {
    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk" }));
    fireEvent.click(screen.getByLabelText("Import CSV"));

    expect(settingsOpenSignal.value).toBe(true);
    expect(modeSignal.value).toBe("bulk");
    expect(bulkInputSourceSignal.value).toBe("paste");
  });

  it("updates voice, format, speed, and keeps unsupported WebGPU disabled", () => {
    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.change(screen.getByLabelText("Voice"), { target: { value: "am_adam" } });
    fireEvent.change(screen.getByLabelText("Format"), { target: { value: "mp3" } });
    fireEvent.input(screen.getByLabelText("Speed 1.00x"), { target: { value: "1.15" } });

    expect(selectedVoiceSignal.value).toBe("am_adam");
    expect(outputFormatSignal.value).toBe("mp3");
    expect(speedSignal.value).toBe(1.15);
    expect(screen.getByRole("option", { name: "WebGPU unavailable" })).toHaveProperty("disabled", true);
  });

  it("clears stale imported CSV state when Import CSV is disabled", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "import";
    bulkFileNameSignal.value = "clips.csv";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello world" }];
    bulkParseErrorSignal.value = "Old import warning";

    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByLabelText("Import CSV"));

    expect(bulkInputSourceSignal.value).toBe("paste");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([]);
  });

  it("clears stale pasted CSV state when Import CSV is enabled", () => {
    modeSignal.value = "bulk";
    bulkInputSourceSignal.value = "paste";
    bulkCsvTextSignal.value = "id,text\nintro,Hello world";
    bulkFileNameSignal.value = "Pasted CSV";
    bulkRowsSignal.value = [{ rowIndex: 1, id: "intro", text: "Hello world" }];
    bulkParseErrorSignal.value = "Old paste warning";

    render(<ComposerSettingsDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByLabelText("Import CSV"));

    expect(bulkInputSourceSignal.value).toBe("import");
    expect(bulkCsvTextSignal.value).toBe("");
    expect(bulkFileNameSignal.value).toBe("");
    expect(bulkParseErrorSignal.value).toBeNull();
    expect(bulkRowsSignal.value).toEqual([]);
  });

  it("closes settings when clicking outside the dropdown wrapper", () => {
    render(
      <div>
        <ComposerSettingsDropdown />
        <button type="button">Outside target</button>
      </div>,
    );

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsButton);

    expect(settingsOpenSignal.value).toBe(true);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("true");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside target" }));

    expect(settingsOpenSignal.value).toBe(false);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes settings when Escape is pressed", () => {
    render(<ComposerSettingsDropdown />);

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsButton);

    expect(settingsOpenSignal.value).toBe(true);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(settingsOpenSignal.value).toBe(false);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps settings open when interacting with dropdown controls", () => {
    render(<ComposerSettingsDropdown />);

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsButton);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Bulk" }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk" }));
    fireEvent.change(screen.getByLabelText("Voice"), { target: { value: "am_adam" } });
    fireEvent.input(screen.getByLabelText("Speed 1.00x"), { target: { value: "1.15" } });

    expect(settingsOpenSignal.value).toBe(true);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("true");
    expect(modeSignal.value).toBe("bulk");
    expect(selectedVoiceSignal.value).toBe("am_adam");
    expect(speedSignal.value).toBe(1.15);
  });

  it("keeps aria-expanded accurate across open, outside close, and reopen", () => {
    render(
      <div>
        <ComposerSettingsDropdown />
        <button type="button">Outside target</button>
      </div>,
    );

    const settingsButton = screen.getByRole("button", { name: "Settings" });

    expect(settingsButton.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(settingsButton);
    expect(settingsOpenSignal.value).toBe(true);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("true");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside target" }));
    expect(settingsOpenSignal.value).toBe(false);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(settingsButton);
    expect(settingsOpenSignal.value).toBe(true);
    expect(settingsButton.getAttribute("aria-expanded")).toBe("true");
  });

  it("disables and closes settings while the model is loading", () => {
    settingsOpenSignal.value = true;

    render(<ComposerSettingsDropdown disabled />);

    const settingsButton = screen.getByRole("button", { name: "Settings" });

    expect(settingsButton).toHaveProperty("disabled", true);
    expect(settingsOpenSignal.value).toBe(false);
    expect(screen.queryByText("Generation settings")).toBeNull();

    fireEvent.click(settingsButton);

    expect(settingsOpenSignal.value).toBe(false);
  });
});

describe("ModelDropdown", () => {
  it("shows Kokoro enabled and Pollinations disabled", () => {
    render(<ModelDropdown />);

    expect(screen.getByRole("option", { name: "Model: Kokoro" })).toHaveProperty("disabled", false);
    expect(screen.getByRole("option", { name: "Model: Pollinations - coming soon" })).toHaveProperty("disabled", true);
    expect(screen.queryByRole("option", { name: "Heart · en-us" })).toBeNull();
  });

  it("disables model selection while the model is loading", () => {
    render(<ModelDropdown disabled />);

    expect(screen.getByLabelText("Model")).toHaveProperty("disabled", true);
  });
});
