import Link from 'next/link';
import { PiggyBank, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { BudgetForm } from '@/features/budgets/budget-form';
import { BudgetDeleteButton } from '@/features/budgets/budget-delete-button';
import { budgetCategories } from '@/features/budgets/model';
import {
  currentMonth,
  monthSchema,
  monthTitle,
} from '@/features/reports/model';
import { requireUser } from '@/lib/auth';
import { listBudgets } from '@/lib/budgets';
import { formatAmount } from '@/lib/validation';

export const metadata = { title: 'Presupuestos' };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  await requireUser();
  const query = await searchParams;
  const parsed = monthSchema.safeParse(query.month ?? currentMonth());
  const month = parsed.success ? parsed.data : currentMonth();
  const { items } = await listBudgets(month);
  return (
    <AppShell>
      <main className="workspace-main budgets-overview" id="main-content">
        <div className="budgets-heading">
          <div className="page-heading">
            <span className="eyebrow">PLANIFICA TU MES</span>
            <h1>
              Presupuestos<span>.</span>
            </h1>
            <p>Define límites y sigue cuánto has utilizado por categoría.</p>
          </div>
          <form method="get" className="month-selector">
            <label>
              Mes
              <input type="month" name="month" defaultValue={month} required />
            </label>
            <button className="button primary">Consultar</button>
            <Link href="/presupuestos">Mes actual</Link>
          </form>
        </div>
        <div className="budgets-layout">
          <section className="budgets-list-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CONTROL POR CATEGORÍA</span>
                <h2>{monthTitle(month)}</h2>
              </div>
              <span className="budget-count">{items.length} configurados</span>
            </div>
            <div
              className="budget-list"
              role="region"
              aria-label="Presupuestos"
              tabIndex={0}
            >
              {items.length === 0 ? (
                <div className="empty-state budget-empty">
                  <PiggyBank size={34} />
                  <h3>Aún no tienes presupuestos</h3>
                  <p>Elige una categoría y crea tu primer límite mensual.</p>
                </div>
              ) : (
                items.map((budget) => {
                  const exceeded = budget.remaining.startsWith('-');
                  const width = Math.min(100, budget.usagePercent);
                  return (
                    <article className="budget-row" key={budget.id}>
                      <div className="budget-row-main">
                        <span className="budget-category-icon">
                          <TrendingUp size={18} />
                        </span>
                        <div>
                          <strong>{budgetCategories[budget.category]}</strong>
                          <small>{budget.currency}</small>
                        </div>
                      </div>
                      <div className="budget-progress">
                        <div>
                          <span
                            style={{ width: `${width}%` }}
                            data-exceeded={exceeded}
                          />
                        </div>
                        <small>
                          {budget.usagePercent.toLocaleString('es-PE', {
                            maximumFractionDigits: 1,
                          })}
                          % utilizado
                        </small>
                      </div>
                      <div className="budget-values">
                        <strong>
                          {formatAmount(budget.spent, budget.currency)}
                        </strong>
                        <small>
                          de {formatAmount(budget.amount, budget.currency)}
                        </small>
                      </div>
                      <div
                        className={
                          exceeded
                            ? 'budget-remaining exceeded'
                            : 'budget-remaining'
                        }
                      >
                        <small>{exceeded ? 'Excedido' : 'Disponible'}</small>
                        <strong>
                          {formatAmount(budget.remaining, budget.currency)}
                        </strong>
                      </div>
                      <BudgetDeleteButton
                        id={budget.id}
                        label={budgetCategories[budget.category]}
                      />
                    </article>
                  );
                })
              )}
            </div>
          </section>
          <aside className="create-panel budget-create-panel">
            <div className="panel-heading">
              <h2>Nuevo presupuesto</h2>
            </div>
            <p>
              Configura o actualiza un límite para{' '}
              {monthTitle(month).toLowerCase()}.
            </p>
            <BudgetForm month={month} />
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
