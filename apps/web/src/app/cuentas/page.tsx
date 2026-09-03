import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { Wallet, Landmark, ArrowUpRight } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { listAccounts, type Account } from '@/lib/accounts';
import { formatAmount } from '@/lib/validation';
import { getBalance } from '@/lib/transactions';
import { Brand } from '@/components/brand';
import { LogoutButton } from '@/components/logout-button';
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
    <div className="workspace">
      <header className="workspace-header">
        <Brand />
        <LogoutButton />
      </header>
      <main className="workspace-main">
        <div className="page-heading">
          <span className="eyebrow">MI ESPACIO PERSONAL</span>
          <h1>
            Mis cuentas<span>.</span>
          </h1>
          <p>Organiza dónde está tu dinero. Este es tu punto de partida.</p>
          <span className="user-email">{user.email}</span>
        </div>
        <div className="accounts-layout">
          <section aria-label="Tus cuentas">
            {failed ? (
              <div className="empty-state">
                <h2>No pudimos cargar tus cuentas</h2>
                <p>
                  Comprueba que el backend esté disponible e inténtalo de nuevo.
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
              <div className="account-grid">
                {items.map((account, index) => (
                  <article className="account-card" key={account.id}>
                    <div className="card-top">
                      <span className="account-icon">
                        <Landmark size={21} />
                      </span>
                      <span className="currency-tag">{account.currency}</span>
                    </div>
                    <h2>{account.name}</h2>
                    <p>{types[account.type]}</p>
                    <div className="account-balance">
                      <small>Saldo actual</small>
                      <strong>
                        {balanceResults[index].status === 'fulfilled'
                          ? formatAmount(
                              balanceResults[index].value.balance,
                              account.currency,
                            )
                          : 'No disponible'}
                      </strong>
                    </div>
                    <Link
                      className="account-detail-link"
                      href={`/cuentas/${account.id}`}
                    >
                      Ver movimientos <ArrowUpRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
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
            <p className="section-note">
              Saldo inicial más ingresos menos gastos. Cada cuenta conserva su
              moneda.
            </p>
          </section>
          <aside className="create-panel">
            <div className="panel-heading">
              <h2>Nueva cuenta</h2>
              <ArrowUpRight size={22} />
            </div>
            <p>Empieza con las cuentas que usas a diario.</p>
            <AccountForm />
          </aside>
        </div>
      </main>
      <footer className="workspace-footer">
        Finance Pro · Un paso a la vez.
      </footer>
    </div>
  );
}
