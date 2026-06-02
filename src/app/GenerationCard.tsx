import type { ComponentChildren } from "preact";

type GenerationCardProps = {
  children: ComponentChildren;
};

export function GenerationCard({ children }: GenerationCardProps) {
  return <section className="tts-card">{children}</section>;
}
