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
});

describe("ModelDropdown", () => {
  it("shows Kokoro enabled and Pollinations disabled", () => {
    render(<ModelDropdown />);

    expect(screen.getByRole("option", { name: "Model: Kokoro" })).toHaveProperty("disabled", false);
    expect(screen.getByRole("option", { name: "Model: Pollinations - coming soon" })).toHaveProperty("disabled", true);
    expect(screen.queryByRole("option", { name: "Heart · en-us" })).toBeNull();
  });
});
