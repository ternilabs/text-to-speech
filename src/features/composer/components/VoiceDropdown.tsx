import { useEffect, useRef, useState } from "preact/hooks";
import { ChevronDown } from "preact-feather";
import { VOICE_OPTIONS } from "@/features/tts/constants";
import { selectedVoiceSignal } from "@/features/tts/signals";

const VOICE_GROUPS = [
  { label: "American Female", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("af_")) },
  { label: "American Male", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("am_")) },
  { label: "British Female", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("bf_")) },
  { label: "British Male", voices: VOICE_OPTIONS.filter(v => v.id.startsWith("bm_")) },
].filter(g => g.voices.length > 0);

type VoiceDropdownProps = {
  disabled?: boolean;
};

export function VoiceDropdown({ disabled = false }: VoiceDropdownProps) {
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

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selectVoice = (voiceId: string) => {
    if (disabled) return;
    selectedVoiceSignal.value = voiceId;
    setIsOpen(false);
  };

  const voiceLabel = selectedVoiceSignal.value;

  return (
    <div className="voice-anchor" ref={anchorRef}>
      <button
        type="button"
        className={`voice-button${isOpen ? " open" : ""}`}
        aria-expanded={isOpen}
        aria-controls="voice-menu"
        aria-label="Select voice"
        disabled={disabled}
        onClick={() => { if (!disabled) setIsOpen(prev => !prev); }}
      >
        <span className="voice-button-label">
          <span className="voice-dot" aria-hidden="true" />
          <span>{voiceLabel}</span>
        </span>
        <ChevronDown size={13} strokeWidth={2} />
      </button>
      <div id="voice-menu" className={`voice-menu${isOpen ? " open" : ""}`} role="listbox" aria-label="Voice selector">
        {VOICE_GROUPS.map(group => (
          <div key={group.label} role="group" aria-label={group.label}>
            <div className="voice-group-label">{group.label}</div>
            {group.voices.map(voice => (
              <button
                key={voice.id}
                type="button"
                className={`voice-option${selectedVoiceSignal.value === voice.id ? " selected" : ""}`}
                role="option"
                aria-selected={selectedVoiceSignal.value === voice.id}
                onClick={() => selectVoice(voice.id)}
              >
                <span className="voice-check">{selectedVoiceSignal.value === voice.id ? "\u2713" : ""}</span>
                <span>
                  <span className="voice-title">{voice.id}</span>
                  <span className="voice-desc">{voice.name} · {voice.language}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
