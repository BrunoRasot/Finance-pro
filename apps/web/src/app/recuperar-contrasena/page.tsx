import { AuthLayout } from '@/components/auth-layout';
import { AuthForm } from '@/features/auth/auth-form';
export const metadata = { title: 'Recuperar acceso' };
export default function RecoverPage() {
  return (
    <AuthLayout>
      <p className="eyebrow muted">RECUPERA TU ACCESO</p>
      <h2>
        Volvamos a<br />
        conectar.
      </h2>
      <p className="intro">
        Te enviaremos un enlace para elegir una nueva contraseña.
      </p>
      <AuthForm mode="recover" />
    </AuthLayout>
  );
}
