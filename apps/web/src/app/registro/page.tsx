import { AuthLayout } from '@/components/auth-layout';
import { AuthForm } from '@/features/auth/auth-form';
export const metadata = { title: 'Crear cuenta' };
export default function RegisterPage() {
  return (
    <AuthLayout>
      <p className="eyebrow muted">TU PRIMER PASO</p>
      <h2>
        Empieza a cuidar
        <br />
        tu tranquilidad.
      </h2>
      <p className="intro">Crea tu acceso personal a Finance Pro.</p>
      <AuthForm mode="register" />
    </AuthLayout>
  );
}
