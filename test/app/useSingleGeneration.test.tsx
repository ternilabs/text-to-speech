import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appErrorSignal,
  appWarningsSignal,
  deviceSignal,
  outputFormatSignal,
  selectedVoiceSignal,
  singleAudioResultSignal,
  speedSignal,
  statusMessageSignal,
  statusSignal,
  textSignal,
} from "../features/tts/signals";
import { useSingleGeneration } from "./useSingleGeneration";

const workerClientMock = vi.hoisted(() => ({
  load: vi.fn(),
  generate: vi.fn(),
  cancel: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("../features/tts/workerClient", () => ({
  createTtsWorkerClient: vi.fn(() => workerClientMock),
}));

function TestHarness() {
  const singleGeneration = useSingleGeneration();

  return (
    <div>
      <span data-testid="status">{statusSignal.value}</span>
      <span data-testid="message">{statusMessageSignal.value}</span>
      <button type="button" disabled={!singleGeneration.canGenerate} onClick={() => void singleGeneration.generate()}>
        Generate
      </button>
    </div>
  );
}

const resetSignals = () => {
  textSignal.value = "";
  selectedVoiceSignal.value = "af_heart";
  outputFormatSignal.value = "wav";
  deviceSignal.value = "wasm";
  speedSignal.value = 1;
  statusSignal.value = "idle";
  statusMessageSignal.value = "Ready for local generation.";
  singleAudioResultSignal.value = null;
  appWarningsSignal.value = [];
  appErrorSignal.value = null;
};

describe("useSingleGeneration", () => {
  beforeEach(() => {
    resetSignals();
    workerClientMock.load.mockReset();
    workerClientMock.generate.mockReset();
    workerClientMock.cancel.mockReset();
    workerClientMock.dispose.mockReset();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test-audio"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts Kokoro preload on mount and returns to idle when ready", async () => {
    let resolveLoad: () => void = () => undefined;
    workerClientMock.load.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    render(<TestHarness />);

    expect(workerClientMock.load).toHaveBeenCalledTimes(1);
    expect(workerClientMock.load).toHaveBeenCalledWith("wasm");
    expect(statusSignal.value).toBe("loading-model");
    expect(statusMessageSignal.value).toBe("Loading Kokoro model");
    expect(screen.getByRole("button", { name: "Generate" })).toHaveProperty("disabled", true);

    resolveLoad();

    await waitFor(() => {
      expect(statusSignal.value).toBe("idle");
      expect(statusMessageSignal.value).toBe("Kokoro model ready.");
    });
  });

  it("does not call load again when generating after preload finished", async () => {
    textSignal.value = "Hello from preload";
    workerClientMock.load.mockResolvedValue(undefined);
    workerClientMock.generate.mockResolvedValue({
      pcm: new Float32Array([0, 0.2, -0.2]),
      sampleRate: 24000,
    });

    render(<TestHarness />);

    await waitFor(() => {
      expect(statusSignal.value).toBe("idle");
      expect(screen.getByRole("button", { name: "Generate" })).toHaveProperty("disabled", false);
    });

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(workerClientMock.generate).toHaveBeenCalledTimes(1);
      expect(statusSignal.value).toBe("ready");
    });

    expect(workerClientMock.load).toHaveBeenCalledTimes(1);
    expect(workerClientMock.generate).toHaveBeenCalledWith({
      text: "Hello from preload",
      voice: "af_heart",
      device: "wasm",
      speed: 1,
    });
  });

  it("keeps generation disabled while preload is pending", () => {
    textSignal.value = "Do not generate yet";
    workerClientMock.load.mockImplementation(() => new Promise<void>(() => undefined));

    render(<TestHarness />);

    const generateButton = screen.getByRole("button", { name: "Generate" });
    expect(generateButton).toHaveProperty("disabled", true);

    fireEvent.click(generateButton);

    expect(workerClientMock.generate).not.toHaveBeenCalled();
    expect(workerClientMock.load).toHaveBeenCalledTimes(1);
  });

  it("reports preload failure without attempting generation", async () => {
    textSignal.value = "Hello after failure";
    workerClientMock.load.mockRejectedValue(new Error("Failed to load Kokoro model."));

    render(<TestHarness />);

    await waitFor(() => {
      expect(statusSignal.value).toBe("error");
      expect(statusMessageSignal.value).toBe("Model preload failed.");
      expect(appErrorSignal.value).toBe("Failed to load Kokoro model.");
    });

    expect(workerClientMock.generate).not.toHaveBeenCalled();
  });

  it("loads a new device during generation when the selected device changes after preload", async () => {
    textSignal.value = "Generate on changed device";
    workerClientMock.load.mockResolvedValue(undefined);
    workerClientMock.generate.mockResolvedValue({
      pcm: new Float32Array([0, 0.1, -0.1]),
      sampleRate: 24000,
    });

    render(<TestHarness />);

    await waitFor(() => {
      expect(statusSignal.value).toBe("idle");
    });

    deviceSignal.value = "webgpu";

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(workerClientMock.generate).toHaveBeenCalledTimes(1);
      expect(statusSignal.value).toBe("ready");
    });

    expect(workerClientMock.load).toHaveBeenCalledTimes(2);
    expect(workerClientMock.load).toHaveBeenNthCalledWith(1, "wasm");
    expect(workerClientMock.load).toHaveBeenNthCalledWith(2, "webgpu");
    expect(workerClientMock.generate).toHaveBeenCalledWith({
      text: "Generate on changed device",
      voice: "af_heart",
      device: "webgpu",
      speed: 1,
    });
  });
});
