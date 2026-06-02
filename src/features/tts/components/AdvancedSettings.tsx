import { useEffect, useState } from "preact/hooks";
import { Cpu, Settings } from "preact-feather";
import {
  deviceSignal,
  settingsOpenSignal,
  speedSignal,
} from "../signals";
import type { DeviceOption } from "../types";

type NavigatorWithGpu = Navigator & {
  gpu?: unknown;
};

export function AdvancedSettings() {
  const [hasWebGpu, setHasWebGpu] = useState(false);

  useEffect(() => {
    const supported = typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithGpu).gpu);
    setHasWebGpu(supported);
    if (!supported && deviceSignal.value === "webgpu") {
      deviceSignal.value = "wasm";
    }
  }, []);

  return (
    <section className="settings-block">
      <button
        type="button"
        className="ghost-pill"
        aria-expanded={settingsOpenSignal.value}
        aria-controls="advanced-settings-panel"
        onClick={() => {
          settingsOpenSignal.value = !settingsOpenSignal.value;
        }}
      >
        <Settings size={15} strokeWidth={1.8} />
        Settings
      </button>
      {settingsOpenSignal.value ? (
        <div id="advanced-settings-panel" className="settings-grid">
          <label className="field-stack" htmlFor="device-select">
            <span className="field-label field-label--icon">
              <Cpu size={13} strokeWidth={1.8} />
              Device
            </span>
            <select
              id="device-select"
              className="select-control"
              value={deviceSignal.value}
              onChange={(event) => {
                deviceSignal.value = (event.currentTarget as HTMLSelectElement).value as DeviceOption;
              }}
            >
              <option value="wasm">WASM / CPU</option>
              <option value="webgpu" disabled={!hasWebGpu}>
                {hasWebGpu ? "WebGPU" : "WebGPU unavailable"}
              </option>
            </select>
          </label>
          <label className="field-stack" htmlFor="speed-range">
            <span className="field-label">Speed {speedSignal.value.toFixed(2)}x</span>
            <input
              id="speed-range"
              className="range-control"
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={speedSignal.value}
              onInput={(event) => {
                speedSignal.value = Number((event.currentTarget as HTMLInputElement).value);
              }}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
