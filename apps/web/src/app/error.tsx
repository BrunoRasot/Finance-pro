'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-page">
      <h1>No pudimos cargar esta página.</h1>
      <p>Inténtalo de nuevo en un momento.</p>
      <button className="button primary" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
