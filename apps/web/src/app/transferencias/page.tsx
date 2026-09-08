import {
  ArrowLeftRight,
  ArrowRight,
  Landmark,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { requireUser } from '@/lib/auth';
import { listAccounts } from '@/lib/accounts';
import { TransferForm } from '@/features/transfers/transfer-form';

export const metadata = { title: 'Transferencias' };

export default async function TransfersPage() {
  await requireUser();
  const { items } = await listAccounts(0, 'ACTIVE', 100);
  return (
    <AppShell>
      <main className="workspace-main transfers-overview" id="main-content">
        <div className="page-heading">
          <span className="eyebrow">MOVER DINERO</span>
          <h1>
            Transferencias<span>.</span>
          </h1>
          <p>
            Mueve fondos entre tus cuentas sin alterar tus ingresos o gastos.
          </p>
        </div>
        <div className="transfer-layout">
          <section className="transfer-explainer">
            <span className="transfer-hero-icon">
              <ArrowLeftRight size={29} />
            </span>
            <h2>Una operación, dos cuentas</h2>
            <p>
              El importe sale de una cuenta y entra en la otra dentro de una
              sola operación. Ambas deben usar la misma moneda.
            </p>
            <div className="transfer-route" aria-hidden="true">
              <div>
                <span>
                  <Landmark size={20} />
                </span>
                <small>ORIGEN</small>
                <strong>Cuenta de salida</strong>
              </div>
              <span className="transfer-route-arrow">
                <ArrowRight size={22} />
              </span>
              <div>
                <span>
                  <Wallet size={20} />
                </span>
                <small>DESTINO</small>
                <strong>Cuenta de entrada</strong>
              </div>
            </div>
            <div className="transfer-assurance">
              <ShieldCheck size={18} />
              <span>
                <strong>Movimiento atómico</strong>
                <small>Si una parte falla, no se guarda ninguna.</small>
              </span>
            </div>
          </section>
          <section className="create-panel transfer-panel">
            <div className="panel-heading">
              <h2>Nueva transferencia</h2>
            </div>
            <p>Selecciona el origen, el destino y el importe.</p>
            {items.length < 2 ? (
              <div className="empty-state">
                <h3>Necesitas al menos dos cuentas</h3>
                <p>Crea otra cuenta activa para comenzar a transferir.</p>
              </div>
            ) : (
              <TransferForm accounts={items} />
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
