import { PublicPage } from '@/components/public-page';

export const metadata = { title: 'Términos de uso' };

export default function TermsPage() {
  return (
    <PublicPage title="Términos de uso" updated="8 de septiembre de 2026">
      <p>
        Finance Pro es una herramienta de organización personal. Al utilizarla,
        aceptas registrar información verdadera para tu propio uso y proteger
        las credenciales de tu cuenta.
      </p>
      <h2>No es asesoría financiera</h2>
      <p>
        Los cálculos, resúmenes y presupuestos son informativos. No constituyen
        asesoría financiera, contable, tributaria o de inversión, ni garantizan
        resultados económicos.
      </p>
      <h2>Disponibilidad y responsabilidad</h2>
      <p>
        Procuramos mantener el servicio disponible y los cálculos correctos,
        pero pueden existir interrupciones. Conserva tus propios respaldos y
        verifica la información antes de tomar decisiones importantes.
      </p>
      <h2>Uso permitido</h2>
      <p>
        No debes intentar acceder a cuentas ajenas, interferir con el servicio,
        automatizar solicitudes abusivas ni usar Finance Pro para actividades
        ilícitas.
      </p>
      <h2>Terminación</h2>
      <p>
        Puedes dejar de usar el servicio y eliminar tu cuenta cuando quieras.
        Podemos restringir cuentas que incumplan estos términos o comprometan la
        seguridad de otras personas.
      </p>
      <h2>Contacto y procedimiento</h2>
      <p>
        Si una cuenta se restringe, puedes solicitar una revisión escribiendo a{' '}
        <a href="mailto:rye933864@gmail.com">rye933864@gmail.com</a>. Indica el
        correo de la cuenta y una descripción del caso, sin enviar contraseñas
        ni información financiera.
      </p>
    </PublicPage>
  );
}
