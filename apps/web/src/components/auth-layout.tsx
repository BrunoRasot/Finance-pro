import { ArrowUpRight, ShieldCheck, Wallet, Sparkles } from 'lucide-react';
import { Brand } from './brand';
import { ThemeSelect } from './theme-provider';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="Bienvenido a Finance Pro">
        <Brand />
        <div className="story-content">
          <span className="eyebrow">
            <span className="status-dot" /> TU DINERO, CON CLARIDAD
          </span>
          <h1>
            Un buen futuro
            <br />
            empieza con
            <br />
            <span>pequeños pasos.</span>
          </h1>
          <p>
            Un espacio para organizar tus cuentas y construir una relación más
            consciente con tu dinero.
          </p>
          <div className="story-card">
            <span className="story-card-icon">
              <Wallet size={24} />
            </span>
            <div>
              <strong>Todo comienza con una cuenta</strong>
              <p>Efectivo, banco o billetera. Dale un lugar a tu dinero.</p>
            </div>
            <ArrowUpRight size={20} />
          </div>
          <div className="story-chips">
            <span>
              <ShieldCheck size={15} /> Acceso personal
            </span>
            <span>
              <Sparkles size={15} /> Menos complicaciones
            </span>
          </div>
        </div>
        <footer>
          FINANCE PRO <span>Un paso a la vez.</span>
        </footer>
      </section>
      <section className="auth-panel">
        <div className="auth-theme">
          <ThemeSelect />
        </div>
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-panel-inner">{children}</div>
        <div className="auth-bottom">
          <span>Tus finanzas merecen un espacio propio.</span>
          <nav aria-label="Información legal">
            <a href="/privacidad">Privacidad</a>
            <a href="/terminos">Términos</a>
            <a href="/soporte">Soporte</a>
          </nav>
        </div>
      </section>
    </main>
  );
}
