import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/features/auth/auth-provider';
import {
  useAppTheme,
  type ThemePreference,
} from '@/features/theme/theme-provider';
import { Button, Card, Heading, Screen } from '@/ui/components';
import type { Palette } from '@/ui/theme';
import { apiResponse } from '@/lib/api';
import { config } from '@/lib/config';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { colors, preference, setPreference } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [deleting, setDeleting] = useState(false);
  const links = [
    {
      title: 'Presupuestos',
      copy: 'Límites mensuales por categoría',
      icon: 'pie-chart-outline' as const,
      href: '/(app)/budgets' as const,
    },
    {
      title: 'Exportar datos',
      copy: 'Copia de seguridad y archivo para Excel',
      icon: 'download-outline' as const,
      href: '/(app)/exports' as const,
    },
  ];
  async function deleteAccount() {
    setDeleting(true);
    try {
      await apiResponse('/profile', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: 'ELIMINAR' }),
      });
      await signOut();
      Alert.alert(
        'Cuenta eliminada',
        'Tus datos y tu acceso fueron eliminados.',
      );
    } catch (error) {
      Alert.alert(
        'No pudimos eliminar la cuenta',
        error instanceof Error ? error.message : 'Inténtalo nuevamente.',
      );
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="TU ESPACIO PERSONAL"
        title="Más opciones"
        subtitle="Preferencias, herramientas y seguridad."
      />
      <Card style={{ gap: 13 }}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{session?.user.email}</Text>
            <Text style={styles.meta}>Sesión segura y protegida</Text>
          </View>
        </View>
      </Card>
      <Text style={styles.section}>APARIENCIA</Text>
      <View style={styles.themes}>
        {(['system', 'light', 'dark'] as ThemePreference[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setPreference(value)}
            style={[styles.theme, preference === value && styles.selected]}
          >
            <Ionicons
              name={
                value === 'system'
                  ? 'phone-portrait-outline'
                  : value === 'light'
                    ? 'sunny-outline'
                    : 'moon-outline'
              }
              size={19}
              color={colors.ink}
            />
            <Text style={styles.themeText}>
              {value === 'system'
                ? 'Sistema'
                : value === 'light'
                  ? 'Claro'
                  : 'Oscuro'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.section}>HERRAMIENTAS</Text>
      {links.map((item) => (
        <Pressable
          key={item.title}
          onPress={() => router.push(item.href)}
          style={styles.link}
        >
          <View style={styles.linkIcon}>
            <Ionicons name={item.icon} size={21} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.copy}</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
      ))}
      <Text style={styles.section}>PRIVACIDAD Y SOPORTE</Text>
      {[
        ['Política de privacidad', '/privacidad'],
        ['Términos de uso', '/terminos'],
        ['Ayuda y soporte', '/soporte'],
      ].map(([title, path]) => (
        <Pressable
          key={path}
          onPress={() => void Linking.openURL(`${config.webOrigin}${path}`)}
          style={styles.link}
        >
          <View style={styles.linkIcon}>
            <Ionicons name="open-outline" size={21} color={colors.primary} />
          </View>
          <Text style={styles.linkTitle}>{title}</Text>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Pressable>
      ))}
      <Card style={{ gap: 10 }}>
        <Text style={styles.dangerTitle}>Eliminar cuenta y datos</Text>
        <Text style={styles.meta}>
          Esta acción elimina permanentemente tu acceso y toda tu información
          financiera.
        </Text>
        <Button
          title="Eliminar mi cuenta"
          variant="danger"
          loading={deleting}
          onPress={() =>
            Alert.alert(
              '¿Eliminar definitivamente?',
              'No podrás recuperar tus cuentas, movimientos, presupuestos ni metas.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar definitivamente',
                  style: 'destructive',
                  onPress: () => void deleteAccount(),
                },
              ],
            )
          }
        />
      </Card>
      <Button
        title="Cerrar sesión"
        onPress={() => {
          void signOut();
        }}
        variant="secondary"
      />
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    identity: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    email: { color: colors.ink, fontWeight: '800' },
    meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
    section: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginTop: 3,
    },
    themes: { flexDirection: 'row', gap: 8 },
    theme: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 11,
      backgroundColor: colors.surface,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    themeText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    linkIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 },
    dangerTitle: { color: colors.danger, fontWeight: '800', fontSize: 14 },
  });
