'use client';
import { useActionState } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@/features/auth/actions';
export function LogoutButton() {
  const [state, action, pending] = useActionState(logout, {});
  return (
    <form action={action}>
      <button className="button subtle" disabled={pending}>
        <LogOut size={16} />
        {pending ? 'Saliendo…' : 'Cerrar sesión'}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
