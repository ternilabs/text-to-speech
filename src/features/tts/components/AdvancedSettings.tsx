import { useEffect, useState } from "preact/hooks";
import { Settings } from "preact-feather";
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
        onClick={() => {
          settingsOpenSignal.value = !settingsOpenSignal.value;
        }}
      >
        <Settings size={15} stroke-width={1.8} />
        Settings
      </button>
      {settingsOpenSignal.value ? (
        <div className="settings-grid">
          <label className="field-stack">
            <span className="field-label">Device</span>
            <select
              className="select-control"
              value={deviceSignal.value}
              onChange={(event) => {
                deviceSignal.value = (event.currentTarget as HTMLSelectElement).value as DeviceOption;
              }}
            >
              <option value="wasm">WASM / CPU</option>
              <option value="webgpu" disabled={!hasWebGpu}>
                WebGPU{hasWebGpu ? "" : " unavailable"}
              </option>
            </select>
          </label>
          <label className="field-stack">
            <span className="field-label">Speed: {speedSignal.value.toFixed(2)}x</span>
            <input
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
