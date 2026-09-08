import {
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Exportar datos' };

export default async function ExportPage() {
  await requireUser();
  return (
    <AppShell>
      <main className="workspace-main exports-overview" id="main-content">
        <div className="page-heading exports-heading">
          <span className="eyebrow">TUS DATOS, SIEMPRE CONTIGO</span>
          <h1>
            Exportar datos<span>.</span>
          </h1>
          <p>Descarga una copia de tu información financiera cuando quieras.</p>
        </div>

        <div className="exports-layout">
          <section className="exports-options" aria-labelledby="exports-title">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">FORMATOS DISPONIBLES</span>
                <h2 id="exports-title">Elige cómo usar tus datos</h2>
              </div>
            </div>

            <article className="export-card">
              <span className="export-icon">
                <DatabaseBackup size={24} />
              </span>
              <div className="export-copy">
                <div>
                  <h3>Respaldo completo</h3>
                  <span className="currency-tag">JSON</span>
                </div>
                <p>
                  Cuentas, movimientos, transferencias, presupuestos, metas y
                  aportes en un solo archivo.
                </p>
                <small>
                  Ideal para conservar una copia técnica de toda tu información.
                </small>
              </div>
              <Link
                className="button primary"
                href="/descargas/json"
                prefetch={false}
              >
                <Download size={17} /> Descargar JSON
              </Link>
            </article>

            <article className="export-card">
              <span className="export-icon">
                <FileSpreadsheet size={24} />
              </span>
              <div className="export-copy">
                <div>
                  <h3>Historial de movimientos</h3>
                  <span className="currency-tag">CSV</span>
                </div>
                <p>
                  Todos tus ingresos y gastos con fecha, cuenta, moneda,
                  categoría e importe.
                </p>
                <small>
                  Compatible con Excel, Google Sheets y otras hojas de cálculo.
                </small>
              </div>
              <Link
                className="button primary"
                href="/descargas/csv"
                prefetch={false}
              >
                <Download size={17} /> Descargar CSV
              </Link>
            </article>
          </section>

          <aside className="export-security">
            <div className="export-security-heading">
              <span className="export-security-icon">
                <ShieldCheck size={22} />
              </span>
              <span className="eyebrow">EXPORTACIÓN PRIVADA</span>
            </div>
            <h2>Solo descargas tus datos</h2>
            <p>
              Finance Pro identifica tu sesión antes de generar cada archivo. La
              descarga no incluye información de otras personas.
            </p>
            <div className="export-security-note">
              <LockKeyhole size={18} />
              <div>
                <strong>Generación bajo demanda</strong>
                <small>
                  El archivo no se almacena públicamente y el navegador no debe
                  guardarlo en caché.
                </small>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
