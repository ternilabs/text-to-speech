import { useEffect, useRef, useState } from "preact/hooks";
import { ChevronDown, Settings } from "preact-feather";
import { VOICE_OPTIONS } from "../../tts/constants";
import { setBulkInputSource } from "../csvInput";
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
  textSignal,
} from "../../tts/signals";
import type { DeviceOption, OutputFormat } from "../../tts/types";

type NavigatorWithGpu = Navigator & {
  gpu?: unknown;
};

type ComposerSettingsDropdownProps = {
  disabled?: boolean;
};

const MODE_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "bulk", label: "Bulk" },
];

const BULK_INPUT_OPTIONS = [
  { value: "import", label: "Import CSV" },
  { value: "paste", label: "Paste rows" },
];

const FORMAT_OPTIONS = [
  { value: "wav", label: "WAV" },
  { value: "mp3", label: "MP3 Experimental" },
];

const BACKEND_OPTIONS = [
  { value: "wasm", label: "WASM / CPU" },
  { value: "webgpu", label: "WebGPU" },
];

const VOICE_GROUPS = [
  { label: "American Female", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("af_")) },
  { label: "American Male", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("am_")) },
  { label: "British Female", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("bf_")) },
  { label: "British Male", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("bm_")) },
].filter(g => g.voices.length > 0);

export function ComposerSettingsDropdown({ disabled = false }: ComposerSettingsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [hasWebGpu, setHasWebGpu] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const isOpen = settingsOpenSignal.value && !disabled;

  useEffect(() => {
    const supported = typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithGpu).gpu);
    setHasWebGpu(supported);
    if (!supported && deviceSignal.value === "webgpu") {
      deviceSignal.value = "wasm";
    }
  }, []);

  useEffect(() => {
    if (disabled && settingsOpenSignal.value) {
      settingsOpenSignal.value = false;
    }
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && dropdownRef.current?.contains(target)) return;
      settingsOpenSignal.value = false;
      setOpenMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        settingsOpenSignal.value = false;
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleMenu = (name: string) => {
    setOpenMenu(prev => prev === name ? null : name);
  };

  const selectMode = (value: string) => {
    modeSignal.value = value as "single" | "bulk";
    // Reset input signals when switching modes
    textSignal.value = "";
    bulkCsvTextSignal.value = "";
    bulkRowsSignal.value = [];
    bulkFileNameSignal.value = "";
    bulkParseErrorSignal.value = null;
    setOpenMenu(null);
  };

  const selectBulkInput = (value: string) => {
    setBulkInputSource(value as "import" | "paste");
    setOpenMenu(null);
  };

  const selectVoice = (voiceId: string) => {
    selectedVoiceSignal.value = voiceId;
    setOpenMenu(null);
  };

  const selectFormat = (value: string) => {
    outputFormatSignal.value = value as OutputFormat;
    setOpenMenu(null);
  };

  const selectBackend = (value: string) => {
    deviceSignal.value = value as DeviceOption;
    setOpenMenu(null);
  };

  const voiceLabel = selectedVoiceSignal.value;

  return (
    <div className="composer-dropdown-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`btn btn-ghost${isOpen ? " active-settings" : ""}`}
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          settingsOpenSignal.value = !settingsOpenSignal.value;
          if (settingsOpenSignal.value) setOpenMenu(null);
        }}
      >
        <Settings size={15} strokeWidth={1.8} />
        Settings
      </button>
      {isOpen ? (
        <div className="composer-dropdown composer-settings-dropdown">
          <div className="sd-row">
            <div>
              <div className="sd-label">Mode</div>
              <div className="sd-sub">Generation type</div>
            </div>
            <div className="setting-select-wrap">
              <button
                type="button"
                className={`setting-select-button${openMenu === "mode" ? " open" : ""}`}
                onClick={() => toggleMenu("mode")}
                aria-haspopup="listbox"
                aria-expanded={openMenu === "mode"}
              >
                <span className="setting-select-label">{modeSignal.value === "single" ? "Single" : "Bulk"}</span>
                <ChevronDown className="setting-caret" size={13} strokeWidth={2} />
              </button>
              <div className={`setting-menu${openMenu === "mode" ? " open" : ""}`} role="listbox" aria-label="Mode selection">
                {MODE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" className={`setting-option${modeSignal.value === opt.value ? " selected" : ""}`} onClick={() => selectMode(opt.value)}>
                    <span className="setting-check">{modeSignal.value === opt.value ? "\u2713" : ""}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sd-row">
            <div>
              <div className="sd-label">Input</div>
              <div className="sd-sub">Bulk source</div>
            </div>
            <div className="setting-select-wrap">
              <button
                type="button"
                className={`setting-select-button${openMenu === "bulk-input" ? " open" : ""}`}
                onClick={() => toggleMenu("bulk-input")}
                aria-haspopup="listbox"
                aria-expanded={openMenu === "bulk-input"}
              >
                <span className="setting-select-label">{bulkInputSourceSignal.value === "import" ? "Import CSV" : "Paste rows"}</span>
                <ChevronDown className="setting-caret" size={13} strokeWidth={2} />
              </button>
              <div className={`setting-menu${openMenu === "bulk-input" ? " open" : ""}`} role="listbox" aria-label="Bulk input selection">
                {BULK_INPUT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" className={`setting-option${bulkInputSourceSignal.value === opt.value ? " selected" : ""}`} onClick={() => selectBulkInput(opt.value)}>
                    <span className="setting-check">{bulkInputSourceSignal.value === opt.value ? "\u2713" : ""}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sd-row">
            <div>
              <div className="sd-label">Voice</div>
              <div className="sd-sub">Speaker preset</div>
            </div>
            <div className="setting-select-wrap">
              <button
                type="button"
                className={`setting-select-button${openMenu === "voice" ? " open" : ""}`}
                onClick={() => toggleMenu("voice")}
                aria-haspopup="listbox"
                aria-expanded={openMenu === "voice"}
              >
                <span className="setting-select-label">{voiceLabel}</span>
                <ChevronDown className="setting-caret" size={13} strokeWidth={2} />
              </button>
              <div className={`setting-menu${openMenu === "voice" ? " open" : ""}`} role="listbox" aria-label="Voice selection">
                {VOICE_GROUPS.map(group => (
                  <div key={group.label} role="group" aria-label={group.label}>
                    <div className="setting-group-label">{group.label}</div>
                    {group.voices.map(voice => (
                      <button key={voice.id} type="button" className={`setting-option${selectedVoiceSignal.value === voice.id ? " selected" : ""}`} onClick={() => selectVoice(voice.id)}>
                        <span className="setting-check">{selectedVoiceSignal.value === voice.id ? "\u2713" : ""}</span>
                        {voice.id}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sd-row">
            <div>
              <div className="sd-label">Speed</div>
              <div className="sd-sub">Playback rate</div>
            </div>
            <div className="speed-wrap">
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={speedSignal.value}
                onInput={(event) => {
                  speedSignal.value = Number((event.currentTarget as HTMLInputElement).value);
                }}
              />
              <span className="speed-val">{speedSignal.value.toFixed(2)}x</span>
            </div>
          </div>

          <div className="sd-row">
            <div>
              <div className="sd-label">Format</div>
              <div className="sd-sub">Output encoding</div>
            </div>
            <div className="setting-select-wrap">
              <button
                type="button"
                className={`setting-select-button${openMenu === "fmt" ? " open" : ""}`}
                onClick={() => toggleMenu("fmt")}
                aria-haspopup="listbox"
                aria-expanded={openMenu === "fmt"}
              >
                <span className="setting-select-label">{outputFormatSignal.value === "wav" ? "WAV" : "MP3 Experimental"}</span>
                <ChevronDown className="setting-caret" size={13} strokeWidth={2} />
              </button>
              <div className={`setting-menu${openMenu === "fmt" ? " open" : ""}`} role="listbox" aria-label="Format selection">
                {FORMAT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" className={`setting-option${outputFormatSignal.value === opt.value ? " selected" : ""}`} onClick={() => selectFormat(opt.value)}>
                    <span className="setting-check">{outputFormatSignal.value === opt.value ? "\u2713" : ""}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sd-row">
            <div>
              <div className="sd-label">Backend</div>
              <div className="sd-sub">Inference runtime</div>
            </div>
            <div className="setting-select-wrap">
              <button
                type="button"
                className={`setting-select-button${openMenu === "backend" ? " open" : ""}`}
                onClick={() => toggleMenu("backend")}
                aria-haspopup="listbox"
                aria-expanded={openMenu === "backend"}
              >
                <span className="setting-select-label">{deviceSignal.value === "wasm" ? "WASM / CPU" : "WebGPU"}</span>
                <ChevronDown className="setting-caret" size={13} strokeWidth={2} />
              </button>
              <div className={`setting-menu${openMenu === "backend" ? " open" : ""}`} role="listbox" aria-label="Backend selection">
                {BACKEND_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`setting-option${deviceSignal.value === opt.value ? " selected" : ""}`}
                    disabled={opt.value === "webgpu" && !hasWebGpu}
                    onClick={() => selectBackend(opt.value)}
                  >
                    <span className="setting-check">{deviceSignal.value === opt.value ? "\u2713" : ""}</span>
                    {opt.value === "webgpu" && !hasWebGpu ? "WebGPU unavailable" : opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
