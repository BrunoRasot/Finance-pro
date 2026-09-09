import { PublicPage } from '@/components/public-page';

export const metadata = { title: 'Política de privacidad' };

export default function PrivacyPage() {
  return (
    <PublicPage
      title="Política de privacidad"
      updated="8 de septiembre de 2026"
    >
      <p>
        Finance Pro permite registrar y organizar información financiera
        personal. Esta política explica qué datos usamos y cómo puedes ejercer
        control sobre ellos.
      </p>
      <h2>Datos que tratamos</h2>
      <p>
        Guardamos tu correo e identificador de acceso, cuentas financieras,
        saldos iniciales, movimientos, transferencias, presupuestos, metas y
        aportes que decides registrar. No solicitamos credenciales bancarias ni
        conectamos directamente con bancos.
      </p>
      <h2>Finalidad y proveedores</h2>
      <p>
        Usamos los datos únicamente para ofrecer las funciones de Finance Pro.
        Supabase procesa la autenticación, Neon almacena la información
        financiera y Render ejecuta la web y la API. No vendemos datos ni los
        utilizamos para publicidad.
      </p>
      <h2>Seguridad y conservación</h2>
      <p>
        El acceso requiere una sesión válida y la API limita cada consulta al
        identificador del usuario. Conservamos los datos mientras mantengas tu
        cuenta. Cuando las copias cifradas de recuperación están activadas, se
        conservan por un máximo de 14 días antes de su eliminación automática.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes descargar tus datos, corregirlos o eliminar tu cuenta desde
        Configuración. La eliminación borra el acceso y la información
        financiera asociada. Si no puedes iniciar sesión, utiliza la página
        pública de eliminación de cuenta.
      </p>
      <h2>Responsable y contacto</h2>
      <p>
        Bruno Rasot es responsable de Finance Pro. Para consultar, corregir,
        exportar o eliminar tus datos, escribe a{' '}
        <a href="mailto:rye933864@gmail.com">rye933864@gmail.com</a>. Las
        solicitudes se revisan y responden por correo.
      </p>
    </PublicPage>
  );
}
