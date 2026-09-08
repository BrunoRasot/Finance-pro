import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/auth-provider';
import { ThemeProvider, useAppTheme } from '@/features/theme/theme-provider';

function Navigation() {
  const { dark } = useAppTheme();
  return (
    <AuthProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
export default function RootLayout() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
