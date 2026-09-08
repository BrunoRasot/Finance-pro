import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View, type ColorValue } from 'react-native';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/features/theme/theme-provider';

function icon(
  name: keyof typeof Ionicons.glyphMap,
  activeBackground: ColorValue,
) {
  function TabIcon({
    color,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return (
      <View
        style={{
          width: 42,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? activeBackground : 'transparent',
        }}
      >
        <Ionicons name={name} color={color} size={20} />
      </View>
    );
  }
  return TabIcon;
}

export default function AppLayout() {
  const { colors } = useAppTheme();
  const { session, loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (!session) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          backgroundColor: colors.surface,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        },
        tabBarIconStyle: {
          width: 42,
          height: 28,
          margin: 0,
        },
        tabBarLabelStyle: {
          width: '100%',
          marginTop: 3,
          marginBottom: 0,
          fontSize: 10,
          lineHeight: 12,
          fontWeight: '700',
          textAlign: 'center',
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: icon('grid-outline', colors.primarySoft),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Cuentas',
          tabBarIcon: icon('wallet-outline', colors.primarySoft),
        }}
      />
      <Tabs.Screen
        name="transfers"
        options={{
          title: 'Mover',
          tabBarIcon: icon('swap-horizontal-outline', colors.primarySoft),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          tabBarIcon: icon('flag-outline', colors.primarySoft),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Más',
          tabBarIcon: icon('menu-outline', colors.primarySoft),
        }}
      />
      <Tabs.Screen name="account/[id]" options={{ href: null }} />
      <Tabs.Screen name="budgets" options={{ href: null }} />
      <Tabs.Screen name="exports" options={{ href: null }} />
    </Tabs>
  );
}
