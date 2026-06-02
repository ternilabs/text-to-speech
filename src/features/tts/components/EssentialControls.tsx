import { VOICE_OPTIONS } from "../constants";
import {
  outputFormatSignal,
  selectedVoiceSignal,
} from "../signals";
import type { OutputFormat } from "../types";

export function EssentialControls() {
  return (
    <div className="control-grid">
      <label className="field-stack">
        <span className="field-label">Voice</span>
        <select
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
      <label className="field-stack">
        <span className="field-label">Output</span>
        <select
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
    </div>
  );
}
