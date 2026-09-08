import Link from 'next/link';
import { Target } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { GoalActions } from '@/features/goals/goal-actions';
import { GoalForm } from '@/features/goals/goal-form';
import { requireUser } from '@/lib/auth';
import { listGoals } from '@/lib/goals';
import { formatAmount } from '@/lib/validation';

export const metadata = { title: 'Metas de ahorro' };
export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireUser();
  const archived = (await searchParams).view === 'archived';
  const { items } = await listGoals(archived ? 'ARCHIVED' : 'ACTIVE');
  return (
    <AppShell>
      <main className="workspace-main goals-overview" id="main-content">
        <div className="goals-heading">
          <div className="page-heading">
            <span className="eyebrow">CONSTRUYE TU FUTURO</span>
            <h1>
              Metas de ahorro<span>.</span>
            </h1>
            <p>
              Convierte tus planes en objetivos medibles y registra cada avance.
            </p>
          </div>
          <nav className="account-view-switch" aria-label="Estado de metas">
            <Link href="/metas" aria-current={!archived ? 'page' : undefined}>
              Activas
            </Link>
            <Link
              href="/metas?view=archived"
              aria-current={archived ? 'page' : undefined}
            >
              Archivadas
            </Link>
          </nav>
        </div>
        <div className="goals-layout">
          <section className="goals-list-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">TUS OBJETIVOS</span>
                <h2>{archived ? 'Metas archivadas' : 'Metas en progreso'}</h2>
              </div>
              <span className="budget-count">{items.length} metas</span>
            </div>
            <div
              className="goals-list"
              role="region"
              aria-label="Lista de metas"
              tabIndex={0}
            >
              {items.length === 0 ? (
                <div className="empty-state goal-empty">
                  <Target size={36} />
                  <h3>
                    {archived
                      ? 'No hay metas archivadas'
                      : 'Crea tu primera meta'}
                  </h3>
                  <p>
                    {archived
                      ? 'Las metas que archives aparecerán aquí.'
                      : 'Define un objetivo y comienza a registrar tus aportes.'}
                  </p>
                </div>
              ) : (
                <div className="goal-table-wrap">
                  <table className="goal-table">
                    <thead>
                      <tr>
                        <th>Meta</th>
                        <th>Ahorrado</th>
                        <th>Objetivo</th>
                        <th>Progreso</th>
                        <th>Fecha objetivo</th>
                        <th className="goal-actions-heading">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((goal) => {
                        const completed = goal.progressPercent >= 100;
                        return (
                          <tr key={goal.id}>
                            <td>
                              <strong className="goal-table-name">
                                {goal.name}
                              </strong>
                              <span className="currency-tag">
                                {goal.currency}
                              </span>
                            </td>
                            <td className="goal-money">
                              {formatAmount(goal.savedAmount, goal.currency)}
                            </td>
                            <td className="goal-money">
                              {formatAmount(goal.targetAmount, goal.currency)}
                            </td>
                            <td>
                              <div className="goal-progress-cell">
                                <strong
                                  className={completed ? 'goal-complete' : ''}
                                >
                                  {goal.progressPercent.toLocaleString(
                                    'es-PE',
                                    {
                                      maximumFractionDigits: 1,
                                    },
                                  )}
                                  %
                                </strong>
                                <div
                                  className="goal-progress"
                                  aria-label={`${goal.progressPercent}% completado`}
                                >
                                  <span
                                    style={{
                                      width: `${Math.min(100, goal.progressPercent)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="goal-date">
                              {goal.deadline
                                ? new Intl.DateTimeFormat('es-PE', {
                                    dateStyle: 'medium',
                                    timeZone: 'UTC',
                                  }).format(
                                    new Date(`${goal.deadline}T00:00:00Z`),
                                  )
                                : 'Sin fecha'}
                            </td>
                            <td className="goal-actions-cell">
                              <GoalActions goal={goal} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
          {!archived && (
            <aside className="create-panel goal-create-panel">
              <div className="panel-heading">
                <h2>Nueva meta</h2>
              </div>
              <p>
                Define cuánto quieres ahorrar y avanza con aportes
                independientes.
              </p>
              <GoalForm />
            </aside>
          )}
        </div>
      </main>
    </AppShell>
  );
}
