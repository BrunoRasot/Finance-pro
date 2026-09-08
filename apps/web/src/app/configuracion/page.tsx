import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { DeleteAccountForm } from '@/features/profile/delete-account-form';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Configuración' };

export default async function SettingsPage() {
  const { user } = await requireUser();
  return (
    <AppShell>
      <main className="workspace-main settings-page" id="main-content">
        <div className="page-heading">
          <span className="eyebrow">CUENTA Y PRIVACIDAD</span>
          <h1>Configuración.</h1>
          <p>Administra tu acceso y revisa cómo protegemos tus datos.</p>
        </div>
        <section className="settings-card">
          <h2>Tu cuenta</h2>
          <p>{user.email}</p>
          <div className="legal-links">
            <Link href="/privacidad">Política de privacidad</Link>
            <Link href="/terminos">Términos de uso</Link>
            <Link href="/soporte">Ayuda y soporte</Link>
          </div>
        </section>
        <section className="settings-card danger-zone">
          <h2>Eliminar cuenta</h2>
          <p>
            Puedes eliminar tu cuenta y toda la información financiera asociada
            sin contactar a soporte.
          </p>
          <DeleteAccountForm />
        </section>
      </main>
    </AppShell>
  );
}
