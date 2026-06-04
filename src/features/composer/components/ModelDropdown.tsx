type ModelDropdownProps = {
  disabled?: boolean;
};

export function ModelDropdown({ disabled = false }: ModelDropdownProps) {
  return (
    <label className="sr-only-wrapper" htmlFor="composer-model-select">
      <span className="sr-only">Model</span>
      <select
        id="composer-model-select"
        className="composer-model-select"
        value="kokoro"
        disabled={disabled}
        onChange={() => undefined}
      >
        <option value="kokoro">Model: Kokoro</option>
        <option value="pollinations" disabled>
          Model: Pollinations - coming soon
        </option>
      </select>
    </label>
  );
}
