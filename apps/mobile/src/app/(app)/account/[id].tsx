import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { useIdempotentOperation } from '@/features/use-idempotent-operation';
import { amount, getBalance, getMovements, today } from '@/lib/finance';
import type { Balance, Currency, Movement } from '@/lib/types';
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

const labels: Record<string, string> = {
  SALARY: 'Salario',
  FREELANCE: 'Trabajo independiente',
  FOOD: 'Alimentación',
  TRANSPORT: 'Transporte',
  HOUSING: 'Vivienda',
  HEALTH: 'Salud',
  EDUCATION: 'Educación',
  ENTERTAINMENT: 'Entretenimiento',
  OTHER: 'Otros',
  TRANSFER: 'Transferencia',
};
export default function AccountDetail() {
  const { colors } = useAppTheme();
  const local = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    currency?: Currency;
  }>();
  const id = params.id;
  const currency = params.currency ?? 'PEN';
  const [balance, setBalance] = useState<Balance | null>(null);
  const [items, setItems] = useState<Movement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [value, setValue] = useState('0.00');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [date, setDate] = useState(today());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const operation = useIdempotentOperation();
  const locked = saving || operation.pendingPath !== null;
  const load = useCallback(async () => {
    try {
      const [nextBalance, history] = await Promise.all([
        getBalance(id),
        getMovements(id),
      ]);
      setBalance(nextBalance);
      setItems(history.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function create() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        category,
        amount: value,
        date,
        description: description.trim(),
      };
      if (editingId) {
        await api(`/accounts/${id}/transactions/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await operation.run(`/accounts/${id}/transactions`, payload);
      }
      setValue('0.00');
      setDescription('');
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }
  function edit(item: Movement) {
    if (item.transferId || locked) return;
    setType(item.type);
    setCategory(item.category);
    setValue(item.amount);
    setDate(item.date);
    setDescription(item.description);
    setEditingId(item.id);
    setShowForm(true);
  }
  function remove(item: Movement) {
    if (item.transferId || locked) return;
    Alert.alert(
      'Eliminar movimiento',
      'Esta acción actualizará el saldo de la cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            void api(`/accounts/${id}/transactions/${item.id}`, {
              method: 'DELETE',
            })
              .then(load)
              .catch((e) => setError(e.message)),
        },
      ],
    );
  }
  return (
    <Screen scroll={false}>
      <View style={local.top}>
        <Pressable onPress={() => router.back()} style={local.back}>
          <Ionicons name="arrow-back" size={21} color={colors.ink} />
        </Pressable>
        <Pressable
          disabled={locked}
          onPress={() => setShowForm(!showForm)}
          style={local.add}
        >
          <Ionicons
            name={showForm ? 'close' : 'add'}
            size={22}
            color={colors.white}
          />
        </Pressable>
      </View>
      <Heading
        eyebrow={`CUENTA · ${currency}`}
        title={params.name ?? 'Movimientos'}
        subtitle="Historial y saldo actualizado."
      />
      <ErrorNotice message={error} />
      {operation.pendingPath && !saving ? (
        <ErrorNotice message="Reintenta para confirmar el movimiento con los mismos datos. No cierres esta pantalla hasta confirmar el resultado." />
      ) : null}
      {balance ? (
        <View style={local.balance}>
          <Text style={local.caption}>Saldo actual</Text>
          <Text style={local.net}>{amount(balance.balance, currency)}</Text>
          <View style={local.balanceRow}>
            <Text style={local.income}>
              + {amount(balance.totalIncome, currency)}
            </Text>
            <Text style={local.expense}>
              − {amount(balance.totalExpense, currency)}
            </Text>
          </View>
        </View>
      ) : null}
      {showForm ? (
        <Card style={{ gap: 13 }}>
          <View style={local.segment}>
            <Pressable
              disabled={locked}
              onPress={() => {
                setType('EXPENSE');
                setCategory('FOOD');
              }}
              style={[local.segmentItem, type === 'EXPENSE' && local.active]}
            >
              <Text style={local.segmentText}>Gasto</Text>
            </Pressable>
            <Pressable
              disabled={locked}
              onPress={() => {
                setType('INCOME');
                setCategory('SALARY');
              }}
              style={[local.segmentItem, type === 'INCOME' && local.active]}
            >
              <Text style={local.segmentText}>Ingreso</Text>
            </Pressable>
          </View>
          <Field
            editable={!locked}
            label={`Importe (${currency})`}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
          />
          <Field
            editable={!locked}
            label="Fecha"
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 7 }}
          >
            {(type === 'INCOME'
              ? ['SALARY', 'FREELANCE', 'OTHER']
              : [
                  'FOOD',
                  'TRANSPORT',
                  'HOUSING',
                  'HEALTH',
                  'EDUCATION',
                  'ENTERTAINMENT',
                  'OTHER',
                ]
            ).map((value) => (
              <Pressable
                disabled={locked}
                key={value}
                onPress={() => setCategory(value)}
                style={[local.category, category === value && local.active]}
              >
                <Text style={local.segmentText}>{labels[value]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Field
            editable={!locked}
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            placeholder="¿En qué consistió?"
            maxLength={250}
          />
          <Button
            title={editingId ? 'Guardar cambios' : 'Guardar movimiento'}
            onPress={create}
            loading={saving}
          />
        </Card>
      ) : null}
      <ScrollView contentContainerStyle={{ gap: 9, paddingBottom: 20 }}>
        {items.map((item) => (
          <View key={item.id} style={local.movement}>
            <View
              style={[
                local.dot,
                item.type === 'INCOME' ? local.dotIncome : local.dotExpense,
              ]}
            >
              <Ionicons
                name={item.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                size={16}
                color={item.type === 'INCOME' ? colors.primary : colors.danger}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={local.movementTitle}>
                {item.description || labels[item.category] || item.category}
              </Text>
              <Text style={local.meta}>
                {labels[item.category] ?? item.category} · {item.date}
              </Text>
            </View>
            <Text
              style={
                item.type === 'INCOME'
                  ? local.incomeAmount
                  : local.expenseAmount
              }
            >
              {item.type === 'INCOME' ? '+' : '−'}{' '}
              {amount(item.amount, currency)}
            </Text>
            {!item.transferId ? (
              <View style={local.actions}>
                <Pressable onPress={() => edit(item)}>
                  <Ionicons
                    name="pencil-outline"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
                <Pressable onPress={() => remove(item)}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
        {items.length === 0 ? (
          <Text style={local.empty}>No hay movimientos en esta cuenta.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    top: { flexDirection: 'row', justifyContent: 'space-between' },
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
    add: {
      width: 42,
      height: 42,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    balance: { borderRadius: 16, backgroundColor: colors.ink, padding: 18 },
    caption: { color: '#b9c9c3', fontSize: 11 },
    net: {
      color: colors.white,
      fontSize: 30,
      fontWeight: '900',
      marginVertical: 7,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: '#ffffff22',
      paddingTop: 12,
    },
    income: { color: colors.lime, fontWeight: '700' },
    expense: { color: colors.white, fontWeight: '700' },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 9,
      padding: 3,
    },
    segmentItem: {
      flex: 1,
      alignItems: 'center',
      padding: 10,
      borderRadius: 7,
    },
    active: { backgroundColor: colors.primarySoft },
    segmentText: { color: colors.ink },
    category: {
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.line,
    },
    actions: { flexDirection: 'row', gap: 10, marginLeft: 3 },
    movement: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    dot: {
      width: 36,
      height: 36,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotIncome: { backgroundColor: colors.primarySoft },
    dotExpense: { backgroundColor: colors.dangerSoft },
    movementTitle: { color: colors.ink, fontWeight: '700', fontSize: 13 },
    meta: { color: colors.muted, fontSize: 10, marginTop: 4 },
    incomeAmount: { color: colors.primary, fontWeight: '800', fontSize: 12 },
    expenseAmount: { color: colors.ink, fontWeight: '800', fontSize: 12 },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 35 },
  });
