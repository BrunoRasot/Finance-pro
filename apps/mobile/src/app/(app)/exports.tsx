import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { downloadExport } from '@/lib/export';
import { Button, Card, ErrorNotice, Heading, Screen } from '@/ui/components';
import { useAppTheme } from '@/features/theme/theme-provider';
import type { Palette } from '@/ui/theme';

export default function ExportsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run(type: 'json' | 'csv') {
    setBusy(type);
    setError(null);
    try {
      await downloadExport(
        type === 'json' ? '/exports/data.json' : '/exports/transactions.csv',
        type === 'json'
          ? 'finance-pro-backup.json'
          : 'finance-pro-movimientos.csv',
        type === 'json' ? 'application/json' : 'text/csv',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar.');
    } finally {
      setBusy(null);
    }
  }
  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
      </Pressable>
      <Heading
        eyebrow="TUS DATOS, SIEMPRE CONTIGO"
        title="Exportar datos"
        subtitle="Descarga una copia privada de tu información financiera."
      />
      <ErrorNotice message={error} />
      <Card style={{ gap: 11 }}>
        <View style={styles.row}>
          <Ionicons name="server-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Respaldo completo</Text>
            <Text style={styles.copy}>
              Cuentas, movimientos, transferencias, presupuestos y metas en
              JSON.
            </Text>
          </View>
        </View>
        <Button
          title="Descargar JSON"
          onPress={() => void run('json')}
          loading={busy === 'json'}
        />
      </Card>
      <Card style={{ gap: 11 }}>
        <View style={styles.row}>
          <Ionicons
            name="document-text-outline"
            size={24}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Historial de movimientos</Text>
            <Text style={styles.copy}>
              Archivo CSV compatible con Excel y Google Sheets.
            </Text>
          </View>
        </View>
        <Button
          title="Descargar CSV"
          onPress={() => void run('csv')}
          loading={busy === 'csv'}
        />
      </Card>
      <View style={styles.private}>
        <Ionicons
          name="shield-checkmark-outline"
          size={21}
          color={colors.primary}
        />
        <Text style={styles.copy}>
          La API verifica tu sesión y solo incluye tus propios datos.
        </Text>
      </View>
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    back: {
      width: 42,
      height: 42,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    row: { flexDirection: 'row', gap: 13, alignItems: 'center' },
    title: { color: colors.ink, fontWeight: '800', fontSize: 15 },
    copy: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 3 },
    private: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      padding: 14,
      backgroundColor: colors.primarySoft,
      borderRadius: 11,
    },
  });
