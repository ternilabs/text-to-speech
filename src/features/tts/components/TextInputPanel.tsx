import { textSignal } from "../signals";

export function TextInputPanel() {
  return (
    <section id="single-panel" className="mode-panel" role="tabpanel">
      <label className="field-stack">
        <span className="field-label">Text</span>
        <textarea
          className="tts-textarea"
          value={textSignal.value}
          placeholder="Enter text to speak..."
          rows={6}
          onInput={(event) => {
            textSignal.value = (event.currentTarget as HTMLTextAreaElement).value;
          }}
        />
      </label>
      <p className="helper-text">Generate one local audio file from this text.</p>
    </section>
  );
}
