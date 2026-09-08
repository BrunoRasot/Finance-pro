import Link from 'next/link';
import { Brand } from './brand';
import { ThemeSelect } from './theme-provider';

export function PublicPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="public-page" id="main-content">
      <header>
        <Link href="/" aria-label="Finance Pro, inicio">
          <Brand />
        </Link>
        <ThemeSelect />
      </header>
      <article>
        <span className="eyebrow">FINANCE PRO</span>
        <h1>{title}</h1>
        {updated ? (
          <p className="public-updated">Actualizada: {updated}</p>
        ) : null}
        {children}
      </article>
      <footer>
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/terminos">Términos</Link>
        <Link href="/eliminar-cuenta">Eliminar cuenta</Link>
        <Link href="/soporte">Soporte</Link>
      </footer>
    </main>
  );
}
