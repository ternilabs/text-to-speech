import type { ComponentChildren } from "preact";

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
    </main>
  );
}
