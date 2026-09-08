import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/lib/api';
import { amount, currentMonth, listBudgets } from '@/lib/finance';
import type { Budget, Currency } from '@/lib/types';
import {
  Button,
  Card,
  ErrorNotice,
  Field,
  Heading,
  Screen,
} from '@/ui/components';
import { useAppTheme } from '@/features/theme/theme-provider';
import type { Palette } from '@/ui/theme';

const categories = [
  'FOOD',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'EDUCATION',
  'ENTERTAINMENT',
  'OTHER',
];
const labels: Record<string, string> = {
  FOOD: 'Alimentación',
  TRANSPORT: 'Transporte',
  HOUSING: 'Vivienda',
  HEALTH: 'Salud',
  EDUCATION: 'Educación',
  ENTERTAINMENT: 'Entretenimiento',
  OTHER: 'Otros',
};
export default function BudgetsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<Budget[]>([]);
  const [category, setCategory] = useState('FOOD');
  const [currency, setCurrency] = useState<Currency>('PEN');
  const [value, setValue] = useState('0.00');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      setItems((await listBudgets(month)).items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    }
  }, [month]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function save() {
    setSaving(true);
    try {
      await api('/budgets', {
        method: 'PUT',
        body: JSON.stringify({ month, currency, category, amount: value }),
      });
      setValue('0.00');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }
  function remove(item: Budget) {
    Alert.alert(
      'Eliminar presupuesto',
      `Se eliminará ${labels[item.category]}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            void api(`/budgets/${item.id}`, { method: 'DELETE' })
              .then(load)
              .catch((e) => setError(e.message)),
        },
      ],
    );
  }
  return (
    <Screen scroll={false}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
      </Pressable>
      <Heading
        eyebrow="PLANIFICA TU MES"
        title="Presupuestos"
        subtitle="Define límites por categoría y controla cuánto has usado."
      />
      <ErrorNotice message={error} />
      <Card style={{ gap: 12 }}>
        <Field
          label="Mes"
          value={month}
          onChangeText={setMonth}
          placeholder="AAAA-MM"
          maxLength={7}
        />
        <View style={styles.row}>
          {(['PEN', 'USD'] as Currency[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setCurrency(v)}
              style={[styles.choice, currency === v && styles.selected]}
            >
              <Text style={styles.text}>{v}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}
        >
          {categories.map((v) => (
            <Pressable
              key={v}
              onPress={() => setCategory(v)}
              style={[styles.chip, category === v && styles.selected]}
            >
              <Text style={styles.text}>{labels[v]}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Field
          label="Límite mensual"
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
        <Button
          title="Guardar presupuesto"
          onPress={() => void save()}
          loading={saving}
        />
      </Card>
      <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
        {items.map((item) => (
          <Card key={item.id} style={{ gap: 9 }}>
            <View style={styles.between}>
              <Text style={styles.title}>
                {labels[item.category] ?? item.category}
              </Text>
              <Pressable onPress={() => remove(item)}>
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={colors.danger}
                />
              </Pressable>
            </View>
            <Text style={styles.total}>
              {amount(item.spent, item.currency)}{' '}
              <Text style={styles.muted}>
                de {amount(item.amount, item.currency)}
              </Text>
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.progress,
                  { width: `${Math.min(100, item.usagePercent)}%` },
                ]}
              />
            </View>
            <Text style={styles.muted}>
              {item.usagePercent.toFixed(1)}% utilizado · quedan{' '}
              {amount(item.remaining, item.currency)}
            </Text>
          </Card>
        ))}
      </ScrollView>
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
    row: { flexDirection: 'row', gap: 8 },
    choice: {
      flex: 1,
      alignItems: 'center',
      padding: 11,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
    },
    text: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    between: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    total: { color: colors.ink, fontSize: 20, fontWeight: '900' },
    muted: { color: colors.muted, fontSize: 11, fontWeight: '500' },
    track: {
      height: 8,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.surfaceMuted,
    },
    progress: { height: 8, backgroundColor: colors.primary },
  });
