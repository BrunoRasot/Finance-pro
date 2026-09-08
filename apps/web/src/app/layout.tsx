import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Finance Pro — Tu dinero, con claridad',
    template: '%s | Finance Pro',
  },
  description:
    'Organiza tus cuentas personales y da el primer paso hacia unas finanzas más claras.',
  robots: { index: true, follow: true },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preference = (await cookies()).get('finance-pro-theme')?.value;
  const theme =
    preference === 'dark' || preference === 'light' ? preference : 'system';
  return (
    <html lang="es" data-theme={theme}>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
