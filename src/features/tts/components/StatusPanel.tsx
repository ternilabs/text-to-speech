import { AlertTriangle } from "preact-feather";

export type StatusTone = "neutral" | "working" | "success" | "warning" | "error";

type StatusPanelProps = {
  message: string;
  tone: StatusTone;
  progress?: { current: number; total: number; percent: number };
  warnings: string[];
  error: string | null;
};

export function StatusPanel({ message, tone, progress, warnings, error }: StatusPanelProps) {
  const showProgress = progress && progress.total > 0;
  const liveRegion = error ? undefined : "polite";

  return (
    <section className={`status-panel status-panel--${tone}`} aria-live={liveRegion} role={error ? "alert" : undefined}>
      <div className="status-row">
        <span>{message}</span>
        {showProgress ? <strong>{progress.current} / {progress.total} rows · {progress.percent}%</strong> : null}
      </div>
      {showProgress ? (
        <div className="progress-track" aria-label={`Progress ${progress.current} of ${progress.total}`}>
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      ) : null}
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
      {error ? (
        <p className="feedback-strip feedback-strip--error">
          <AlertTriangle size={14} strokeWidth={1.8} />
          <span>{error}</span>
        </p>
      ) : null}
    </section>
  );
}
