import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/lib/api';
import { amount } from '@/lib/finance';
import type { Account, Currency } from '@/lib/types';
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

export default function AccountsScreen() {
  const { colors } = useAppTheme();
  const local = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [currency, setCurrency] = useState<Currency>('PEN');
  const [accountType, setAccountType] = useState<Account['type']>('BANK');
  const [archived, setArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      setItems(
        (
          await api<{ items: Account[] }>(
            `/accounts?limit=100&offset=0&status=${archived ? 'ARCHIVED' : 'ACTIVE'}`,
          )
        ).items,
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    } finally {
      setRefreshing(false);
    }
  }, [archived]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function create() {
    setSaving(true);
    setError(null);
    try {
      await api(editingId ? `/accounts/${editingId}` : '/accounts', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: name.trim(),
          type: accountType,
          ...(editingId ? {} : { currency }),
          openingBalance,
        }),
      });
      setName('');
      setOpeningBalance('0.00');
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear.');
    } finally {
      setSaving(false);
    }
  }
  function edit(item: Account) {
    setName(item.name);
    setOpeningBalance(item.openingBalance);
    setCurrency(item.currency);
    setAccountType(item.type);
    setEditingId(item.id);
    setShowForm(true);
  }
  async function toggleArchive(item: Account) {
    setError(null);
    try {
      await api(`/accounts/${item.id}/${archived ? 'restore' : 'archive'}`, {
        method: 'POST',
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  }
  return (
    <Screen scroll={false}>
      <View style={local.headingRow}>
        <Heading
          eyebrow="TU DINERO ORGANIZADO"
          title="Mis cuentas"
          subtitle="Consulta saldos y registra movimientos."
        />
        <Pressable
          accessibilityLabel="Añadir cuenta"
          onPress={() => setShowForm(!showForm)}
          style={local.add}
        >
          <Ionicons
            name={showForm ? 'close' : 'add'}
            size={23}
            color={colors.white}
          />
        </Pressable>
      </View>
      <ErrorNotice message={error} />
      <View style={local.row}>
        <Pressable
          onPress={() => setArchived(false)}
          style={[local.choice, !archived && local.selected]}
        >
          <Text style={local.choiceText}>Activas</Text>
        </Pressable>
        <Pressable
          onPress={() => setArchived(true)}
          style={[local.choice, archived && local.selected]}
        >
          <Text style={local.choiceText}>Archivadas</Text>
        </Pressable>
      </View>
      {showForm ? (
        <Card style={local.form}>
          <Field
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Cuenta principal"
            maxLength={80}
          />
          <View style={local.row}>
            {(['BANK', 'CASH', 'WALLET'] as Account['type'][]).map((value) => (
              <Pressable
                key={value}
                onPress={() => setAccountType(value)}
                style={[local.choice, accountType === value && local.selected]}
              >
                <Text style={local.choiceText}>
                  {value === 'BANK'
                    ? 'Banco'
                    : value === 'CASH'
                      ? 'Efectivo'
                      : 'Billetera'}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={local.row}>
            <Pressable
              onPress={() => setCurrency('PEN')}
              style={[local.choice, currency === 'PEN' && local.selected]}
            >
              <Text style={local.choiceText}>PEN · Soles</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrency('USD')}
              style={[local.choice, currency === 'USD' && local.selected]}
            >
              <Text style={local.choiceText}>USD · Dólares</Text>
            </Pressable>
          </View>
          <Field
            label="Saldo inicial"
            value={openingBalance}
            onChangeText={setOpeningBalance}
            keyboardType="decimal-pad"
          />
          <Button
            title={editingId ? 'Guardar cambios' : 'Crear cuenta'}
            onPress={create}
            loading={saving}
            disabled={!name.trim()}
          />
        </Card>
      ) : null}
      <ScrollView
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/account/[id]',
                params: {
                  id: item.id,
                  name: item.name,
                  currency: item.currency,
                },
              })
            }
            style={local.account}
          >
            <View style={local.accountIcon}>
              <Ionicons
                name={item.type === 'CASH' ? 'cash-outline' : 'wallet-outline'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={local.accountName}>{item.name}</Text>
              <Text style={local.meta}>
                {item.type === 'BANK'
                  ? 'Banco'
                  : item.type === 'CASH'
                    ? 'Efectivo'
                    : 'Billetera'}{' '}
                · {item.currency}
              </Text>
            </View>
            <Text style={local.opening}>
              {amount(item.openingBalance, item.currency)}
            </Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                edit(item);
              }}
              style={local.iconAction}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                void toggleArchive(item);
              }}
              style={local.iconAction}
            >
              <Ionicons
                name={archived ? 'refresh-outline' : 'archive-outline'}
                size={18}
                color={colors.ink}
              />
            </Pressable>
          </Pressable>
        ))}
        {items.length === 0 && !error ? (
          <Text style={local.empty}>
            Aún no tienes cuentas. Crea la primera para comenzar.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    headingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 14,
    },
    add: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    form: { gap: 14, marginBottom: 4 },
    row: { flexDirection: 'row', gap: 9 },
    choice: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      padding: 12,
      backgroundColor: colors.surfaceMuted,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    choiceText: { color: colors.ink },
    account: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 13,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    accountIcon: {
      width: 42,
      height: 42,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    accountName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
    opening: { color: colors.ink, fontWeight: '700', fontSize: 12 },
    iconAction: {
      width: 36,
      height: 36,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    empty: {
      color: colors.muted,
      textAlign: 'center',
      marginTop: 50,
      lineHeight: 21,
    },
  });
