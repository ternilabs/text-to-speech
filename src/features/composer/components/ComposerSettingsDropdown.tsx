import { useEffect, useState } from "preact/hooks";
import { Settings } from "preact-feather";
import { VOICE_OPTIONS } from "../../tts/constants";
import {
  bulkInputSourceSignal,
  deviceSignal,
  modeSignal,
  outputFormatSignal,
  selectedVoiceSignal,
  settingsOpenSignal,
  speedSignal,
} from "../../tts/signals";
import type { DeviceOption, OutputFormat } from "../../tts/types";

type NavigatorWithGpu = Navigator & {
  gpu?: unknown;
};

export function ComposerSettingsDropdown() {
  const [hasWebGpu, setHasWebGpu] = useState(false);
  const isOpen = settingsOpenSignal.value;
  const isBulk = modeSignal.value === "bulk";
  const isImportCsv = bulkInputSourceSignal.value === "import";

  useEffect(() => {
    const supported = typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithGpu).gpu);
    setHasWebGpu(supported);
    if (!supported && deviceSignal.value === "webgpu") {
      deviceSignal.value = "wasm";
    }
  }, []);

  return (
    <div className="composer-dropdown-wrap">
      <button
        type="button"
        className="composer-select-button"
        aria-expanded={isOpen}
        aria-controls="composer-settings-dropdown"
        onClick={() => {
          settingsOpenSignal.value = !settingsOpenSignal.value;
        }}
      >
        <Settings size={15} strokeWidth={1.8} />
        Settings
      </button>
      {isOpen ? (
        <div id="composer-settings-dropdown" className="composer-dropdown composer-settings-dropdown">
          <p className="dropdown-title">Generation settings</p>
          <div className="settings-row">
            <span>Mode</span>
            <div className="mini-segment" role="group" aria-label="Generation mode">
              <button
                type="button"
                className={!isBulk ? "active" : ""}
                aria-pressed={!isBulk}
                onClick={() => {
                  modeSignal.value = "single";
                }}
              >
                Single
              </button>
              <button
                type="button"
                className={isBulk ? "active" : ""}
                aria-pressed={isBulk}
                onClick={() => {
                  modeSignal.value = "bulk";
                }}
              >
                Bulk
              </button>
            </div>
          </div>
          <div className="settings-row">
            <span>Input</span>
            <label className="switch-row">
              Import CSV
              <input
                type="checkbox"
                checked={isImportCsv}
                onChange={(event) => {
                  bulkInputSourceSignal.value = (event.currentTarget as HTMLInputElement).checked ? "import" : "paste";
                }}
              />
            </label>
          </div>
          <label className="settings-row" htmlFor="composer-voice-select">
            <span>Voice</span>
            <select
              id="composer-voice-select"
              className="select-control"
              value={selectedVoiceSignal.value}
              onChange={(event) => {
                selectedVoiceSignal.value = (event.currentTarget as HTMLSelectElement).value;
              }}
            >
              {VOICE_OPTIONS.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} · {voice.language}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-row" htmlFor="composer-format-select">
            <span>Format</span>
            <select
              id="composer-format-select"
              className="select-control"
              value={outputFormatSignal.value}
              onChange={(event) => {
                outputFormatSignal.value = (event.currentTarget as HTMLSelectElement).value as OutputFormat;
              }}
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3 Experimental</option>
            </select>
          </label>
          <label className="settings-row" htmlFor="composer-device-select">
            <span>Device</span>
            <select
              id="composer-device-select"
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
          <label className="settings-row" htmlFor="composer-speed-range">
            <span>Speed {speedSignal.value.toFixed(2)}x</span>
            <input
              id="composer-speed-range"
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
    </div>
  );
}
