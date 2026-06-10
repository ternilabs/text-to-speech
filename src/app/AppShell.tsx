import type { ComponentChildren } from "preact";
import { Footer } from "./Footer";

type AppShellProps = {
  children: ComponentChildren;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="app-shell">
      <section className="brand-block" aria-label="TerniLabs Text-to-Speech">
        <h1>TerniLabs</h1>
      </section>
      {children}
      <Footer />
    </main>
  );
}
