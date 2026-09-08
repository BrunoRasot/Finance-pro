import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type Palette } from '@/ui/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
const ThemeContext = createContext<{
  colors: Palette;
  dark: boolean;
  preference: ThemePreference;
  setPreference(value: ThemePreference): void;
} | null>(null);
const storageKey = 'finance-pro-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const saved = globalThis.localStorage?.getItem(storageKey);
    return saved === 'light' || saved === 'dark' || saved === 'system'
      ? saved
      : 'system';
  });
  const dark =
    preference === 'system' ? system === 'dark' : preference === 'dark';
  const value = useMemo(
    () => ({
      colors: dark ? darkColors : lightColors,
      dark,
      preference,
      setPreference(next: ThemePreference) {
        globalThis.localStorage?.setItem(storageKey, next);
        setPreferenceState(next);
      },
    }),
    [dark, preference],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value)
    throw new Error('useAppTheme debe usarse dentro de ThemeProvider.');
  return value;
}
