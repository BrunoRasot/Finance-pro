import { requireUser } from '@/lib/auth';
import { AuthLayout } from '@/components/auth-layout';
import { AuthForm } from '@/features/auth/auth-form';
export const metadata = { title: 'Nueva contraseña' };
export default async function UpdatePage() {
  await requireUser();
  return (
    <AuthLayout>
      <p className="eyebrow muted">UN NUEVO COMIENZO</p>
      <h2>
        Elige una
        <br />
        nueva contraseña.
      </h2>
      <p className="intro">
        Usa al menos 12 caracteres y una combinación que no utilices en otros
        sitios.
      </p>
      <AuthForm mode="update" />
    </AuthLayout>
  );
}
