import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ErrorNotice, Heading, Screen } from '@/ui/components';
import { amount, currentMonth, monthlyReport } from '@/lib/finance';
import type { MonthlyReport } from '@/lib/types';
import { useAppTheme } from '@/features/theme/theme-provider';
import type { Palette } from '@/ui/theme';

export default function Dashboard() {
  const { colors } = useAppTheme();
  const local = useMemo(() => makeStyles(colors), [colors]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setError(null);
    try {
      setReport(await monthlyReport(currentMonth()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <Screen scroll={false}>
      <Heading
        eyebrow="TU MES, CON CLARIDAD"
        title="Resumen"
        subtitle={`Resultados de ${currentMonth()} separados por moneda.`}
      />
      <ErrorNotice message={error} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
        contentContainerStyle={{ gap: 14 }}
      >
        {report?.currencies.map((item) => (
          <View key={item.currency} style={local.balance}>
            <View style={local.row}>
              <Text style={local.currency}>
                {item.currency === 'PEN' ? 'Soles' : 'Dólares'}
              </Text>
              <Text style={local.tag}>{item.currency}</Text>
            </View>
            <Text style={local.caption}>Resultado del mes</Text>
            <Text style={local.net}>{amount(item.net, item.currency)}</Text>
            <View style={local.totals}>
              <View>
                <Text style={local.caption}>Ingresos</Text>
                <Text style={local.income}>
                  {amount(item.income, item.currency)}
                </Text>
              </View>
              <View>
                <Text style={local.caption}>Gastos</Text>
                <Text style={local.expense}>
                  {amount(item.expense, item.currency)}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {!report && !error ? (
          <Text style={local.loading}>Cargando tu resumen…</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    balance: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    currency: { color: colors.ink, fontSize: 18, fontWeight: '800' },
    tag: {
      color: colors.primary,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.primarySoft,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 10,
    },
    caption: { color: colors.muted, fontSize: 11 },
    net: { color: colors.ink, fontSize: 32, fontWeight: '900' },
    totals: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 14,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    income: { color: colors.primary, fontWeight: '800', marginTop: 5 },
    expense: {
      color: colors.danger,
      fontWeight: '800',
      marginTop: 5,
      textAlign: 'right',
    },
    loading: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  });
