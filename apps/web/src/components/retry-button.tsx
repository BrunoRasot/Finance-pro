'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

export function RetryButton({
  label = 'Volver a intentar',
}: {
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="button subtle"
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? <LoaderCircle className="spin" size={16} /> : null}
      {pending ? 'Intentando…' : label}
    </button>
  );
}
