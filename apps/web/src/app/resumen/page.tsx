import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { ChartNoAxesCombined } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getMonthlyReport } from '@/lib/reports';
import { formatAmount } from '@/lib/validation';
import { categories } from '@/features/transactions/model';
import {
  categoryPercent,
  currentMonth,
  monthSchema,
  monthTitle,
  type MonthlyReport,
} from '@/features/reports/model';
import { AppShell } from '@/components/app-shell';

export const metadata = { title: 'Resumen mensual' };
export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  await requireUser();
  const query = await searchParams;
  const parsed = monthSchema.safeParse(query.month ?? currentMonth());
  let report: MonthlyReport | null = null;
  if (parsed.success)
    try {
      report = await getMonthlyReport(parsed.data);
    } catch (error) {
      unstable_rethrow(error);
    }
  const selected = parsed.success ? parsed.data : currentMonth();
  return (
    <AppShell>
      <main className="workspace-main summary-overview" id="main-content">
        <div className="summary-toolbar">
          <div>
            <Link href="/cuentas" className="back-link">
              ← Mis cuentas
            </Link>
            <div className="page-heading">
              <span className="eyebrow">TU MES, CON CLARIDAD</span>
              <h1>
                Resumen mensual<span>.</span>
              </h1>
              <p>
                Revisa lo que ingresó y lo que gastaste en todas tus cuentas.
              </p>
            </div>
          </div>
          <form method="get" action="/resumen" className="month-selector">
            <label>
              Mes
              <input
                type="month"
                name="month"
                min="0001-01"
                max="9999-12"
                required
                defaultValue={selected}
                key={selected}
              />
            </label>
            <button className="button primary">Ver resumen</button>
            <Link href="/resumen">Mes actual</Link>
          </form>
        </div>
        {!parsed.success ? (
          <p className="notice error" role="alert">
            El mes no es válido. Elige un mes y vuelve a consultar.
          </p>
        ) : !report ? (
          <div className="empty-state">
            <h2>No pudimos cargar el resumen</h2>
            <p>Comprueba tu conexión e inténtalo de nuevo.</p>
            <Link href={`/resumen?month=${selected}`} className="button subtle">
              Reintentar
            </Link>
          </div>
        ) : (
          <>
            <div className="summary-period">
              <h2 className="report-month">{monthTitle(report.month)}</h2>
              <p className="section-note">
                Se usa la fecha de cada movimiento. El resultado del mes es
                ingresos menos gastos; no incluye los saldos iniciales. Las
                monedas se muestran por separado.
              </p>
            </div>
            <div className="reports-grid">
              {report.currencies.map((group) => (
                <section
                  className="currency-report"
                  key={group.currency}
                  aria-label={
                    group.currency === 'PEN'
                      ? 'Resumen en soles'
                      : 'Resumen en dólares'
                  }
                >
                  <div className="panel-heading">
                    <h2>{group.currency === 'PEN' ? 'Soles' : 'Dólares'}</h2>
                    <span className="currency-tag">{group.currency}</span>
                  </div>
                  <div className="monthly-net">
                    <small>Resultado del mes</small>
                    <strong>{formatAmount(group.net, group.currency)}</strong>
                  </div>
                  <dl className="monthly-totals">
                    <div>
                      <dt>Ingresos</dt>
                      <dd className="income-text">
                        {formatAmount(group.income, group.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt>Gastos</dt>
                      <dd>{formatAmount(group.expense, group.currency)}</dd>
                    </div>
                  </dl>
                  <div
                    className="summary-details"
                    role="region"
                    aria-label={`Categorías en ${group.currency === 'PEN' ? 'soles' : 'dólares'}`}
                    tabIndex={0}
                  >
                    {group.categories.length === 0 ? (
                      <div className="monthly-empty">
                        <ChartNoAxesCombined size={28} />
                        <h3>Sin movimientos este mes</h3>
                        <p>
                          Los ingresos y gastos que registres aparecerán aquí.
                        </p>
                        <Link href="/cuentas">Ir a mis cuentas →</Link>
                      </div>
                    ) : (
                      (['EXPENSE', 'INCOME'] as const).map((type) => {
                        const rows = group.categories.filter(
                          (row) => row.type === type,
                        );
                        const total =
                          type === 'INCOME' ? group.income : group.expense;
                        return (
                          <div className="category-breakdown" key={type}>
                            <h3>
                              {type === 'EXPENSE'
                                ? 'Gastos por categoría'
                                : 'Ingresos por categoría'}
                            </h3>
                            {rows.length === 0 ? (
                              <p className="section-note">
                                Sin {type === 'EXPENSE' ? 'gastos' : 'ingresos'}{' '}
                                registrados.
                              </p>
                            ) : (
                              <ul>
                                {rows.map((row) => {
                                  const percentage = categoryPercent(
                                    row.total,
                                    total,
                                  );
                                  return (
                                    <li key={row.category}>
                                      <div className="category-label">
                                        <span>
                                          {categories[row.category].label}
                                        </span>
                                        <strong>
                                          {formatAmount(
                                            row.total,
                                            group.currency,
                                          )}
                                        </strong>
                                      </div>
                                      <div
                                        className="category-bar"
                                        aria-hidden="true"
                                      >
                                        <span
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <small>
                                        {percentage.toLocaleString('es-PE', {
                                          maximumFractionDigits: 2,
                                        })}
                                        % · {row.count}{' '}
                                        {row.count === '1'
                                          ? 'movimiento'
                                          : 'movimientos'}
                                      </small>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
      <footer className="workspace-footer">
        Finance Pro · Un paso a la vez.
      </footer>
    </AppShell>
  );
}
