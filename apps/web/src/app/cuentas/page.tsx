import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import {
  Wallet,
  Landmark,
  Banknote,
  Info,
  Archive,
  ArrowUpRight,
} from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { listAccounts, type Account } from '@/lib/accounts';
import { formatAmount } from '@/lib/validation';
import { getBalance } from '@/lib/transactions';
import { AppShell } from '@/components/app-shell';

import { AccountForm } from '@/features/accounts/account-form';
import { AccountActions } from '@/features/accounts/account-actions';
const types = { BANK: 'Banco', CASH: 'Efectivo', WALLET: 'Billetera digital' };
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const { user } = await requireUser();
  const query = await searchParams;
  const archived = query.view === 'archived';
  const page = /^\d{1,5}$/.test(query.page ?? '')
    ? Math.min(834, Math.max(1, Number(query.page)))
    : 1;
  let items: Account[] = [];
  let failed = false;
  try {
    items = (
      await listAccounts((page - 1) * 12, archived ? 'ARCHIVED' : 'ACTIVE')
    ).items;
  } catch (error) {
    unstable_rethrow(error);
    failed = true;
  }
  const balanceResults = archived
    ? []
    : await Promise.allSettled(items.map((account) => getBalance(account.id)));
  for (const result of balanceResults)
    if (result.status === 'rejected') unstable_rethrow(result.reason);
  return (
    <AppShell>
      <main className="workspace-main accounts-overview" id="main-content">
        <div className="page-heading accounts-heading">
          <div>
            <span className="eyebrow">MI ESPACIO PERSONAL</span>
            <h1>
              Mis cuentas<span>.</span>
            </h1>
            <p>Un lugar para cada cuenta. Una mirada más clara a tu dinero.</p>
            <span className="user-email">{user.email}</span>
          </div>
          <nav className="account-view-switch" aria-label="Estado de cuentas">
            <Link href="/cuentas" aria-current={!archived ? 'page' : undefined}>
              Activas
            </Link>
            <Link
              href="/cuentas?view=archived"
              aria-current={archived ? 'page' : undefined}
            >
              <Archive size={14} /> Archivadas
            </Link>
          </nav>
        </div>
        <div className="accounts-layout">
          <section className="accounts-list-panel" aria-label="Tus cuentas">
            <div className="accounts-section-heading">
              <div>
                <span className="eyebrow">TU DINERO ORGANIZADO</span>
                <h2>{archived ? 'Cuentas archivadas' : 'Tus cuentas'}</h2>
              </div>
              <span className="accounts-page-label">Página {page}</span>
            </div>
            <div
              className="accounts-scroll"
              role="region"
              aria-label="Lista de cuentas"
              tabIndex={0}
            >
              {failed ? (
                <div className="empty-state">
                  <h2>No pudimos cargar tus cuentas</h2>
                  <p>
                    Comprueba que el backend esté disponible e inténtalo de
                    nuevo.
                  </p>
                  <Link className="button subtle" href="/cuentas">
                    Volver a intentar
                  </Link>
                </div>
              ) : items.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Wallet size={36} />
                  </span>
                  <h2>
                    {page === 1
                      ? archived
                        ? 'No tienes cuentas archivadas'
                        : 'Tu primera cuenta, tu primer paso'
                      : 'No hay más cuentas'}
                  </h2>
                  <p>
                    {page === 1
                      ? archived
                        ? 'Cuando archives una cuenta aparecerá en este espacio.'
                        : 'Añade tu efectivo, cuenta bancaria o billetera digital con su saldo inicial.'
                      : 'Regresa a la página anterior para ver tus cuentas.'}
                  </p>
                </div>
              ) : (
                <table
                  className="accounts-table"
                  aria-label="Cuentas financieras"
                >
                  <colgroup>
                    <col className="account-name-column" />
                    <col className="account-currency-column" />
                    <col className="account-opening-column" />
                    <col className="account-current-column" />
                    <col className="account-actions-column" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Cuenta</th>
                      <th scope="col">Moneda</th>
                      <th scope="col" className="amount-column">
                        Saldo inicial
                      </th>
                      <th scope="col" className="amount-column">
                        Saldo actual
                      </th>
                      <th scope="col">
                        <span className="account-actions-heading">
                          Acciones
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((account, index) => (
                      <tr key={account.id}>
                        <th scope="row">
                          <div className="account-row-identity">
                            <span className="account-icon" aria-hidden="true">
                              {account.type === 'CASH' ? (
                                <Banknote size={18} />
                              ) : account.type === 'WALLET' ? (
                                <Wallet size={18} />
                              ) : (
                                <Landmark size={18} />
                              )}
                            </span>
                            <span>
                              <strong>{account.name}</strong>
                              <small>{types[account.type]}</small>
                            </span>
                          </div>
                        </th>
                        <td>
                          <span className="currency-tag">
                            {account.currency}
                          </span>
                        </td>
                        <td className="amount-column">
                          {formatAmount(
                            account.openingBalance,
                            account.currency,
                          )}
                        </td>
                        <td className="amount-column current-balance">
                          {archived
                            ? 'Archivada'
                            : balanceResults[index].status === 'fulfilled'
                              ? formatAmount(
                                  balanceResults[index].value.balance,
                                  account.currency,
                                )
                              : 'No disponible'}
                        </td>
                        <td>
                          <div className="account-row-actions">
                            {!archived && (
                              <Link
                                className="account-row-link"
                                href={`/cuentas/${account.id}`}
                                aria-label={`Ver movimientos de ${account.name}`}
                              >
                                Movimientos <ArrowUpRight size={15} />
                              </Link>
                            )}
                            <AccountActions account={account} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!failed && (
                <nav className="pagination" aria-label="Páginas de cuentas">
                  {page > 1 && (
                    <Link
                      href={`/cuentas?page=${page - 1}${archived ? '&view=archived' : ''}`}
                    >
                      ← Anterior
                    </Link>
                  )}
                  {items.length === 12 && page < 834 && (
                    <Link
                      href={`/cuentas?page=${page + 1}${archived ? '&view=archived' : ''}`}
                    >
                      Siguiente →
                    </Link>
                  )}
                </nav>
              )}
            </div>
            <p className="section-note accounts-explanation">
              <Info size={14} />
              <span>
                Saldo inicial más ingresos menos gastos. Cada cuenta conserva su
                moneda.
              </span>
            </p>
          </section>
          {archived ? (
            <aside className="create-panel archive-help-panel">
              <span className="empty-icon">
                <Archive size={24} />
              </span>
              <h2>Tu archivo financiero</h2>
              <p>
                Las cuentas archivadas conservan sus movimientos. Restáuralas
                cuando necesites volver a utilizarlas.
              </p>
              <Link className="button subtle" href="/cuentas">
                Volver a cuentas activas
              </Link>
            </aside>
          ) : (
            <aside className="create-panel" id="nueva-cuenta">
              <div className="panel-heading">
                <h2>Nueva cuenta</h2>
              </div>
              <p>
                Añade tu efectivo, banco o billetera y registra desde dónde
                empiezas.
              </p>
              <AccountForm />
            </aside>
          )}
        </div>
      </main>
    </AppShell>
  );
}
