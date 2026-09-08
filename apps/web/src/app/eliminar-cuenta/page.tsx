import Link from 'next/link';
import { PublicPage } from '@/components/public-page';

export const metadata = { title: 'Eliminar cuenta' };

export default function DeleteAccountHelpPage() {
  return (
    <PublicPage title="Eliminar tu cuenta">
      <p>
        Puedes solicitar la eliminación sin instalar la aplicación. Inicia
        sesión en la web, abre Configuración y selecciona “Eliminar mi cuenta”.
      </p>
      <ol>
        <li>
          <Link href="/iniciar-sesion">Inicia sesión en Finance Pro.</Link>
        </li>
        <li>Abre Configuración desde el menú.</li>
        <li>Escribe ELIMINAR y confirma la operación.</li>
      </ol>
      <p>
        Se eliminarán tu identidad de acceso y todas tus cuentas, movimientos,
        transferencias, presupuestos y metas. La operación es permanente.
      </p>
      <p>
        Si no recuerdas tu contraseña, utiliza la opción de recuperación en la
        pantalla de acceso antes de continuar.
      </p>
    </PublicPage>
  );
}
