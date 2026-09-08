import Link from 'next/link';
import { PublicPage } from '@/components/public-page';

export const metadata = { title: 'Soporte' };

export default function SupportPage() {
  return (
    <PublicPage title="Ayuda y soporte">
      <h2>Acceso a tu cuenta</h2>
      <p>
        Si olvidaste tu contraseña, solicita un enlace desde{' '}
        <Link href="/recuperar-contrasena">Recuperar contraseña</Link>.
      </p>
      <h2>Protege tu información</h2>
      <p>
        No compartas contraseñas, enlaces de recuperación ni datos financieros
        completos. Finance Pro nunca solicitará tu contraseña bancaria.
      </p>
      <h2>Eliminar la cuenta</h2>
      <p>
        Consulta la <Link href="/eliminar-cuenta">guía de eliminación</Link>{' '}
        para borrar tu acceso y datos asociados desde la web o la aplicación.
      </p>
      <h2>Reportar un problema</h2>
      <p>
        Puedes abrir un reporte en el{' '}
        <a
          href="https://github.com/BrunoRasot/Finance-pro/issues"
          rel="noreferrer"
          target="_blank"
        >
          centro público de soporte
        </a>
        . Describe el problema sin incluir contraseñas, enlaces de recuperación
        ni información financiera personal.
      </p>
    </PublicPage>
  );
}
