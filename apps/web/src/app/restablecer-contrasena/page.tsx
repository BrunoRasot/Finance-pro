import { redirect } from 'next/navigation';

/**
 * Compatibility route for recovery emails generated before the current
 * callback flow was introduced.
 */
export default function LegacyResetPasswordPage() {
  redirect('/actualizar-contrasena');
}
