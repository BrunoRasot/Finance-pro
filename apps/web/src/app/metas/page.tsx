import Link from 'next/link';
import { Flag, Target } from 'lucide-react';
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
                items.map((goal) => {
                  const completed = goal.progressPercent >= 100;
                  return (
                    <article className="goal-card" key={goal.id}>
                      <div className="goal-card-heading">
                        <span className="goal-icon">
                          <Flag size={19} />
                        </span>
                        <div>
                          <h3>{goal.name}</h3>
                          <small>
                            {goal.deadline
                              ? `Objetivo: ${new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${goal.deadline}T00:00:00Z`))}`
                              : 'Sin fecha límite'}
                          </small>
                        </div>
                        <span className="currency-tag">{goal.currency}</span>
                      </div>
                      <div className="goal-amount">
                        <strong>
                          {formatAmount(goal.savedAmount, goal.currency)}
                        </strong>
                        <span>
                          de {formatAmount(goal.targetAmount, goal.currency)}
                        </span>
                      </div>
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
                      <div className="goal-card-footer">
                        <span className={completed ? 'goal-complete' : ''}>
                          {completed
                            ? 'Meta alcanzada'
                            : `${goal.progressPercent.toLocaleString('es-PE', { maximumFractionDigits: 1 })}% completado`}
                        </span>
                        <GoalActions goal={goal} />
                      </div>
                    </article>
                  );
                })
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
