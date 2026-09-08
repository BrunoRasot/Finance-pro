import { AuthLayout } from '@/components/auth-layout';
import { AuthForm } from '@/features/auth/auth-form';
import { ShieldCheck } from 'lucide-react';
export const metadata = { title: 'Iniciar sesión' };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthLayout>
      <p className="eyebrow muted">BIENVENIDO DE NUEVO</p>
      <h2>
        Vamos a poner
        <br />
        tus cuentas en orden.
      </h2>
      <p className="intro">Entra a tu espacio y continúa donde lo dejaste.</p>
      {error && (
        <p className="notice error" role="alert">
          El enlace no es válido o expiró. Solicita uno nuevo y ábrelo en el
          mismo navegador.
        </p>
      )}
      <AuthForm mode="login" />
      <p className="auth-security-note">
        <ShieldCheck size={15} /> Acceso protegido a tu información financiera
      </p>
    </AuthLayout>
  );
}
