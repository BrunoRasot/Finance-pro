'use client';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <AppShell>
      <main className="workspace-main" id="main-content">
        <div className="empty-state">
          <h1>No pudimos cargar la cuenta</h1>
          <p>Comprueba tu conexión e inténtalo de nuevo.</p>
          <button className="button primary" onClick={reset}>
            Reintentar
          </button>
          <p>
            <Link href="/cuentas">Volver a mis cuentas</Link>
          </p>
        </div>
      </main>
    </AppShell>
  );
}
