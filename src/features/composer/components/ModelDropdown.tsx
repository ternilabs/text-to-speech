import { useEffect, useRef, useState } from "preact/hooks";
import { ChevronDown, Cpu } from "preact-feather";

type ModelDropdownProps = {
  disabled?: boolean;
};

export function ModelDropdown({ disabled = false }: ModelDropdownProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && anchorRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="model-anchor" ref={anchorRef}>
      <button
        type="button"
        className={`model-button${isOpen ? " open" : ""}`}
        aria-expanded={isOpen}
        aria-controls="model-menu"
        aria-label="Select model"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev);
        }}
      >
        <span className="model-button-label">
          <Cpu size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Kokoro</span>
        </span>
        <ChevronDown size={13} strokeWidth={2} />
      </button>
      <div id="model-menu" className={`model-menu${isOpen ? " open" : ""}`} role="listbox" aria-label="Model selector">
        <button type="button" className="model-option selected" role="option" aria-selected="true" onClick={() => setIsOpen(false)}>
          <span className="model-check">{"\u2713"}</span>
          <span>
            <span className="model-title">Kokoro</span>
            <span className="model-desc">Local default synthesis model.</span>
          </span>
        </button>
        <button type="button" className="model-option" role="option" aria-selected="false" disabled>
          <span className="model-check" />
          <span>
            <span className="model-title">Pollinations</span>
            <span className="model-desc">Coming soon.</span>
          </span>
        </button>
      </div>
    </div>
  );
}
