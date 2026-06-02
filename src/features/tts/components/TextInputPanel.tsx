import { textSignal } from "../signals";

export function TextInputPanel() {
  return (
    <label className="field-stack">
      <span className="field-label">Text</span>
      <textarea
        className="tts-textarea"
        value={textSignal.value}
        placeholder="Enter text to speak..."
        onInput={(event) => {
          textSignal.value = (event.currentTarget as HTMLTextAreaElement).value;
        }}
      />
    </label>
  );
}
