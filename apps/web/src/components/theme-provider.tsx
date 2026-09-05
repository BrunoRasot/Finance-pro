'use client';

import { createContext, useContext, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setPreference] = useState(initialTheme);
  function setTheme(next: Theme) {
    setPreference(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `finance-pro-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSelect() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeSelect must be inside ThemeProvider');
  const Icon =
    context.theme === 'dark' ? Moon : context.theme === 'light' ? Sun : Monitor;
  return (
    <label className="theme-select">
      <Icon size={16} aria-hidden="true" />
      <select
        aria-label="Tema de apariencia"
        value={context.theme}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'light' || value === 'dark' || value === 'system')
            context.setTheme(value);
        }}
      >
        <option value="system">Sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
    </label>
  );
}
