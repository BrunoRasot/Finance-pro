import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="center-page">
      <p className="eyebrow muted">404</p>
      <h1>Esta página no existe.</h1>
      <Link className="button primary" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
