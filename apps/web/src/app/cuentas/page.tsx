import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import {
  Wallet,
  Landmark,
  Banknote,
  ArrowUpRight,
  ChartNoAxesCombined,
  Info,
} from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { listAccounts, type Account } from '@/lib/accounts';
import { formatAmount } from '@/lib/validation';
import { getBalance } from '@/lib/transactions';
import { AppShell } from '@/components/app-shell';

import { AccountForm } from '@/features/accounts/account-form';
const types = { BANK: 'Banco', CASH: 'Efectivo', WALLET: 'Billetera digital' };
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user } = await requireUser();
  const query = await searchParams;
  const page = /^\d{1,5}$/.test(query.page ?? '')
    ? Math.min(834, Math.max(1, Number(query.page)))
    : 1;
  let items: Account[] = [];
  let failed = false;
  try {
    items = (await listAccounts((page - 1) * 12)).items;
  } catch (error) {
    unstable_rethrow(error);
    failed = true;
  }
  const balanceResults = await Promise.allSettled(
    items.map((account) => getBalance(account.id)),
  );
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
        </div>
        <div className="accounts-layout">
          <section className="accounts-list-panel" aria-label="Tus cuentas">
            <div className="accounts-section-heading">
              <div>
                <span className="eyebrow">TU DINERO ORGANIZADO</span>
                <h2>Tus cuentas</h2>
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
                      ? 'Tu primera cuenta, tu primer paso'
                      : 'No hay más cuentas'}
                  </h2>
                  <p>
                    {page === 1
                      ? 'Añade tu efectivo, cuenta bancaria o billetera digital con su saldo inicial.'
                      : 'Regresa a la página anterior para ver tus cuentas.'}
                  </p>
                </div>
              ) : (
                <table
                  className="accounts-table"
                  aria-label="Cuentas financieras"
                >
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
                      <th scope="col">Acciones</th>
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
                          {balanceResults[index].status === 'fulfilled'
                            ? formatAmount(
                                balanceResults[index].value.balance,
                                account.currency,
                              )
                            : 'No disponible'}
                        </td>
                        <td>
                          <Link
                            className="account-row-link"
                            href={`/cuentas/${account.id}`}
                            aria-label={`Ver movimientos de ${account.name}`}
                          >
                            Movimientos <ArrowUpRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!failed && (
                <nav className="pagination" aria-label="Páginas de cuentas">
                  {page > 1 && (
                    <Link href={`/cuentas?page=${page - 1}`}>← Anterior</Link>
                  )}
                  {items.length === 12 && page < 834 && (
                    <Link href={`/cuentas?page=${page + 1}`}>Siguiente →</Link>
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
        </div>
      </main>
      <footer className="accounts-bottom-bar">
        <Link className="accounts-report-link" href="/resumen">
          <span className="report-link-icon">
            <ChartNoAxesCombined size={23} />
          </span>
          <span>
            <strong>Descubre cómo va tu mes</strong>
            <small>Consulta tus ingresos y gastos por categoría.</small>
          </span>
          <ArrowUpRight size={20} />
        </Link>
      </footer>
    </AppShell>
  );
}
