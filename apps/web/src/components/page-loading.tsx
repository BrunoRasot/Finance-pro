import { AppShell } from './app-shell';
export function PageLoading({ label }: { label: string }) {
  return (
    <AppShell>
      <main className="workspace-main" id="main-content" aria-busy="true">
        <p role="status" className="section-note">
          {label}
        </p>
        <div className="loading-title" aria-hidden="true" />
        <div className="loading-panels" aria-hidden="true">
          <div />
          <div />
        </div>
      </main>
    </AppShell>
  );
}
