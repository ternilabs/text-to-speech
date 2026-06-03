import { AlertTriangle, CheckCircle, Loader } from "preact-feather";
import type { SingleAudioResult } from "../../tts/signals";
import type { TtsMode, TtsStatus } from "../../tts/types";
import { ComposerAudioPlayer } from "./ComposerAudioPlayer";

type ProgressState = {
  current: number;
  total: number;
  percent: number;
};

type ComposerStatePanelProps = {
  mode: TtsMode;
  status: TtsStatus;
  message: string;
  progress?: ProgressState;
  warnings: string[];
  error: string | null;
  result: SingleAudioResult | null;
};

const getPanelTone = (status: TtsStatus, error: string | null) => {
  if (error || status === "error") return "error";
  if (status === "loading-model" || status === "generating" || status === "exporting") return "working";
  if (status === "ready") return "success";
  if (status === "cancelled") return "warning";
  return "neutral";
};

export function ComposerStatePanel({ mode, status, message, progress, warnings, error, result }: ComposerStatePanelProps) {
  const tone = getPanelTone(status, error);
  const showProgress = progress && progress.total > 0;
  const idleMessage = mode === "single" ? "Generate audio" : "Generate bulk audio";
  const liveRegion = error ? undefined : "polite";
  const panelMessage = status === "idle" ? idleMessage : message;

  return (
    <section className={`composer-state-panel composer-state-panel--${tone}`} aria-live={liveRegion} role={error ? "alert" : undefined}>
      <div className="composer-state-main">
        {tone === "working" ? <Loader size={17} strokeWidth={1.8} /> : null}
        {tone === "success" ? <CheckCircle size={17} strokeWidth={1.8} /> : null}
        {tone === "error" ? <AlertTriangle size={17} strokeWidth={1.8} /> : null}
        <span>{error ?? panelMessage}</span>
        {showProgress ? <strong>{progress.current} / {progress.total} rows · {progress.percent}%</strong> : null}
      </div>
      {showProgress ? (
        <div className="progress-track" aria-label={`Progress ${progress.current} of ${progress.total}`}>
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      ) : null}
      {status === "ready" && mode === "single" && result ? <ComposerAudioPlayer result={result} /> : null}
      {status === "ready" && mode === "bulk" ? <p className="composer-state-copy">Bulk export finished.</p> : null}
      {warnings.length > 0 ? (
        <ul className="message-list">
          {warnings.map((warning, index) => (
            <li className="feedback-strip feedback-strip--warning" key={`${warning}-${index}`}>
              <AlertTriangle size={14} strokeWidth={1.8} />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
