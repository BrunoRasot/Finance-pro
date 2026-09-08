import Link from 'next/link';
import { PublicPage } from '@/components/public-page';

export const metadata = { title: 'Cuenta eliminada' };

export default function DeletedAccountPage() {
  return (
    <PublicPage title="Tu cuenta fue eliminada">
      <p>
        Eliminamos tu acceso y la información financiera asociada. Gracias por
        haber utilizado Finance Pro.
      </p>
      <p>
        <Link className="button primary" href="/registro">
          Volver al inicio
        </Link>
      </p>
    </PublicPage>
  );
}
