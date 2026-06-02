import type { SingleAudioResult } from "../signals";

type AudioPlayerProps = {
  result: SingleAudioResult | null;
};

export function AudioPlayer({ result }: AudioPlayerProps) {
  if (!result) {
    return null;
  }

  return (
    <section className="audio-result">
      <div>
        <span className="field-label">Generated audio</span>
        <strong>{result.filename}</strong>
      </div>
      <audio controls src={result.url} />
      <a className="ghost-pill" href={result.url} download={result.filename}>
        Download
      </a>
    </section>
  );
}
