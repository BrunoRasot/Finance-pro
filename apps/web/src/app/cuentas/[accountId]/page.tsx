import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { findAccount } from '@/lib/accounts';
import { getBalance, getMovements, type Movement } from '@/lib/transactions';
import { formatAmount } from '@/lib/validation';
import { AppShell } from '@/components/app-shell';

import { MovementForm } from '@/features/transactions/movement-form';
import { MovementActions } from '@/features/transactions/movement-actions';
import {
  historyCategories,
  displayDate,
  filtersSchema,
  historyQuery,
  type TransactionChanges,
} from '@/features/transactions/model';
function isEditableMovement(
  movement: Movement,
): movement is Movement & TransactionChanges {
  return movement.category !== 'TRANSFER';
}
export const metadata = { title: 'Movimientos de cuenta' };
export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const { accountId } = await params;
  if (!z.uuid().safeParse(accountId).success) notFound();
  const account = await findAccount(accountId);
  const raw = await searchParams;
  const parsed = filtersSchema.safeParse(
    Object.fromEntries(
      ['type', 'category', 'from', 'to', 'page'].map((key) => [
        key,
        raw[key] || undefined,
      ]),
    ),
  );
  const filters = parsed.success ? parsed.data : { page: 1 };
  // Independent reads: a history failure must not replace the balance with zero.
  const results = await Promise.allSettled([
    getBalance(accountId),
    parsed.success ? getMovements(accountId, filters) : Promise.resolve(null),
  ]);
  for (const result of results)
    if (result.status === 'rejected') unstable_rethrow(result.reason);
  const balance = results[0].status === 'fulfilled' ? results[0].value : null;
  const history = results[1].status === 'fulfilled' ? results[1].value : null;
  const path = `/cuentas/${accountId}`;
  return (
    <AppShell>
      <main
        className="workspace-main account-detail-overview"
        id="main-content"
      >
        <Link className="back-link" href="/cuentas">
          ← Mis cuentas
        </Link>
        <div className="page-heading">
          <span className="eyebrow">CUENTA · {account.currency}</span>
          <h1>
            {account.name}
            <span>.</span>
          </h1>
          <p>Cada movimiento cuenta. Aquí puedes seguir el tuyo.</p>
        </div>
        {balance ? (
          <section
            className="balance-summary"
            aria-label="Resumen de la cuenta"
          >
            <div className="balance-main">
              <small>Saldo actual</small>
              <strong>{formatAmount(balance.balance, account.currency)}</strong>
              <span>
                Saldo inicial:{' '}
                {formatAmount(balance.openingBalance, account.currency)}
              </span>
            </div>
            <div>
              <small>Ingresos registrados</small>
              <strong className="income-text">
                + {formatAmount(balance.totalIncome, account.currency)}
              </strong>
            </div>
            <div>
              <small>Gastos registrados</small>
              <strong>
                {formatAmount(balance.totalExpense, account.currency)}
              </strong>
            </div>
          </section>
        ) : (
          <p role="alert" className="notice error">
            No pudimos cargar el saldo.{' '}
            <Link href={`${path}?${historyQuery(filters)}`}>Reintentar</Link>
          </p>
        )}
        <p className="section-note">
          El saldo incluye todos los movimientos registrados, también los de
          fecha futura. Los filtros solo afectan al historial.
        </p>
        <div className="accounts-layout movement-layout">
          <section className="history-panel">
            <h2>Historial de movimientos</h2>
            <form
              method="get"
              action={path}
              className="history-filters"
              key={historyQuery(filters)}
            >
              <label>
                Tipo
                <select name="type" defaultValue={filters.type ?? ''}>
                  <option value="">Todos</option>
                  <option value="INCOME">Ingresos</option>
                  <option value="EXPENSE">Gastos</option>
                </select>
              </label>
              <label>
                Categoría
                <select name="category" defaultValue={filters.category ?? ''}>
                  <option value="">Todas</option>
                  {Object.entries(historyCategories).map(([key, value]) => (
                    <option value={key} key={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Desde
                <input
                  name="from"
                  type="date"
                  defaultValue={filters.from ?? ''}
                />
              </label>
              <label>
                Hasta
                <input name="to" type="date" defaultValue={filters.to ?? ''} />
              </label>
              <button className="button subtle">Filtrar</button>
              <Link href={path}>Limpiar</Link>
            </form>
            {!parsed.success ? (
              <p className="notice error" role="alert">
                Los filtros no son válidos. Revisa las fechas y el orden del
                intervalo o pulsa «Limpiar».
              </p>
            ) : !history ? (
              <p className="notice error" role="alert">
                No pudimos cargar el historial.{' '}
                <Link href={`${path}?${historyQuery(filters)}`}>
                  Reintentar
                </Link>
              </p>
            ) : history.items.length === 0 ? (
              <div className="empty-state">
                <h3>No hay movimientos en esta vista</h3>
                <p>
                  Registra un ingreso o gasto, o cambia los filtros para
                  consultar otras fechas.
                </p>
              </div>
            ) : (
              <ul className="movement-list">
                {history.items.map((movement) => (
                  <li key={movement.id}>
                    <span
                      className={`movement-icon ${movement.type === 'INCOME' ? 'income' : ''}`}
                    >
                      {movement.type === 'INCOME' ? (
                        <ArrowDownLeft size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </span>
                    <div className="movement-description">
                      <strong>
                        {movement.description ||
                          historyCategories[movement.category].label}
                      </strong>
                      <span>
                        {historyCategories[movement.category].label} ·{' '}
                        {displayDate(movement.date)} ·{' '}
                        {movement.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </div>
                    <strong
                      className={
                        movement.type === 'INCOME' ? 'income-text' : ''
                      }
                    >
                      {movement.type === 'INCOME' ? '+' : '−'}{' '}
                      {formatAmount(movement.amount, account.currency)}
                    </strong>
                    {isEditableMovement(movement) && (
                      <MovementActions
                        accountId={accountId}
                        movement={movement}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {history && (
              <nav className="pagination" aria-label="Páginas de movimientos">
                {filters.page > 1 && (
                  <Link
                    href={`${path}?${historyQuery(filters, filters.page - 1)}`}
                  >
                    ← Anterior
                  </Link>
                )}
                <span>Página {filters.page}</span>
                {history.items.length === 20 && filters.page < 501 && (
                  <Link
                    href={`${path}?${historyQuery(filters, filters.page + 1)}`}
                  >
                    Siguiente →
                  </Link>
                )}
              </nav>
            )}
          </section>
          <aside className="create-panel" id="nuevo-movimiento">
            <div className="panel-heading">
              <h2>Nuevo movimiento</h2>
              <ArrowUpRight size={22} />
            </div>
            <p>Registra un ingreso o gasto en {account.currency}.</p>
            <MovementForm
              accountId={accountId}
              currency={account.currency}
              initialKey={randomUUID()}
              key={accountId}
            />
          </aside>
        </div>
      </main>
      <footer className="workspace-footer">
        Finance Pro · Un paso a la vez.
      </footer>
    </AppShell>
  );
}
