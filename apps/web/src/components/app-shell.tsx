'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Download,
  Gauge,
  Settings,
  Target,
  LayoutGrid,
  LockKeyhole,
  Wallet,
} from 'lucide-react';
import { Brand } from './brand';
import { LogoutButton } from './logout-button';
import { ThemeSelect } from './theme-provider';
const links = [
  { href: '/resumen', label: 'Resumen mensual', icon: ChartNoAxesCombined },
  { href: '/cuentas', label: 'Mis cuentas', icon: Wallet },
  { href: '/transferencias', label: 'Transferencias', icon: ArrowLeftRight },
  { href: '/presupuestos', label: 'Presupuestos', icon: Gauge },
  { href: '/metas', label: 'Metas de ahorro', icon: Target },
  { href: '/exportar', label: 'Exportar datos', icon: Download },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const detail = pathname.startsWith('/cuentas/');
  const title = pathname.startsWith('/resumen')
    ? 'Resumen mensual'
    : pathname.startsWith('/transferencias')
      ? 'Transferencias'
      : pathname.startsWith('/presupuestos')
        ? 'Presupuestos'
        : pathname.startsWith('/metas')
          ? 'Metas de ahorro'
          : pathname.startsWith('/exportar')
            ? 'Exportar datos'
            : pathname.startsWith('/configuracion')
              ? 'Configuración'
              : detail
                ? 'Movimientos'
                : 'Mis cuentas';
  return (
    <div
      className={`workspace app-shell${pathname === '/cuentas' ? ' accounts-shell' : pathname === '/resumen' ? ' summary-shell' : pathname === '/exportar' ? ' exports-shell' : detail ? ' detail-shell' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="app-sidebar">
        <Link
          href="/cuentas"
          className="brand-link"
          aria-label="Finance Pro, mis cuentas"
        >
          <Brand />
        </Link>
        <div className="workspace-label">
          <span className="workspace-symbol">
            <LayoutGrid size={17} />
          </span>
          <div>
            <strong>Mi espacio</strong>
            <small>Finanzas personales</small>
          </div>
          <span className="workspace-status" />
        </div>
        <span className="nav-label">GENERAL</span>
        <nav aria-label="Navegación principal">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={
                pathname.startsWith(href) ? 'nav-item active' : 'nav-item'
              }
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
            >
              <Icon size={19} />
              {label}
              <ChevronRight size={14} />
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <CircleHelp size={19} />
          </span>
          <h2>Un paso a la vez.</h2>
          <p>
            Registrar tus movimientos es el comienzo de unas finanzas más
            claras.
          </p>
        </div>
        <div className="sidebar-bottom">
          <LockKeyhole size={14} />
          <Link href="/privacidad">Privacidad</Link>
          <span>·</span>
          <Link href="/terminos">Términos</Link>
        </div>
      </aside>
      <div className="app-body">
        <header className="workspace-header">
          <Link
            href="/cuentas"
            className="mobile-app-brand"
            aria-label="Finance Pro"
          >
            <Brand />
          </Link>
          <div className="breadcrumbs">
            <span>Mi espacio</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="header-actions">
            <ThemeSelect />
            <LogoutButton />
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
