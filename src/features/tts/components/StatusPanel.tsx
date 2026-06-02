type StatusPanelProps = {
  message: string;
  progress?: { current: number; total: number; percent: number };
  warnings: string[];
  error: string | null;
};

export function StatusPanel({ message, progress, warnings, error }: StatusPanelProps) {
  const showProgress = progress && progress.total > 0;

  return (
    <section className="status-panel" aria-live="polite">
      <div className="status-row">
        <span>{message}</span>
        {showProgress ? <strong>{progress.percent}%</strong> : null}
      </div>
      {showProgress ? (
        <div className="progress-track" aria-label={`Progress ${progress.current} of ${progress.total}`}>
          <span style={{ width: `${progress.percent}%` }} />
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="message-list">
          {warnings.map((warning, index) => (
            <li key={`${warning}-${index}`}>{warning}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
