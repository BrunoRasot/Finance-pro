import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useIdempotentOperation } from '@/features/use-idempotent-operation';
import { listAccounts, today } from '@/lib/finance';
import type { Account } from '@/lib/types';
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

export default function TransfersScreen() {
  const { colors } = useAppTheme();
  const local = useMemo(() => makeStyles(colors), [colors]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [value, setValue] = useState('0.00');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const operation = useIdempotentOperation();
  const locked = saving || operation.pendingPath !== null;
  const load = useCallback(async () => {
    try {
      const data = (await listAccounts()).items;
      setAccounts(data);
      setFrom((v) => v || data[0]?.id || '');
      setTo((v) => v || data[1]?.id || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar.');
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function submit() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await operation.run('/transfers', {
        fromAccountId: from,
        toAccountId: to,
        amount: value,
        date: today(),
        description: description.trim(),
      });
      setValue('0.00');
      setDescription('');
      setNotice('Transferencia registrada correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo transferir.');
    } finally {
      setSaving(false);
    }
  }
  const origin = accounts.find((a) => a.id === from);
  return (
    <Screen>
      <Heading
        eyebrow="MOVER DINERO"
        title="Transferencias"
        subtitle="El importe sale de una cuenta y entra en otra en una sola operación."
      />
      <ErrorNotice message={error} />
      {operation.pendingPath && !saving ? (
        <ErrorNotice message="Reintenta para confirmar la transferencia con los mismos datos. No cierres esta pantalla hasta confirmar el resultado." />
      ) : null}
      {notice ? <Text style={local.notice}>{notice}</Text> : null}
      <Card style={{ gap: 16 }}>
        <Text style={local.label}>Desde</Text>
        <View style={local.choices}>
          {accounts.map((item) => (
            <Pressable
              disabled={locked}
              key={item.id}
              onPress={() => {
                setFrom(item.id);
                if (item.id === to) setTo('');
              }}
              style={[local.choice, from === item.id && local.selected]}
            >
              <Text style={local.name}>{item.name}</Text>
              <Text style={local.meta}>{item.currency}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={local.label}>Hacia</Text>
        <View style={local.choices}>
          {accounts
            .filter(
              (item) => item.id !== from && item.currency === origin?.currency,
            )
            .map((item) => (
              <Pressable
                disabled={locked}
                key={item.id}
                onPress={() => setTo(item.id)}
                style={[local.choice, to === item.id && local.selected]}
              >
                <Text style={local.name}>{item.name}</Text>
                <Text style={local.meta}>{item.currency}</Text>
              </Pressable>
            ))}
        </View>
        <Field
          editable={!locked}
          label={`Importe (${origin?.currency ?? '—'})`}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
        <Field
          editable={!locked}
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Ej. Ahorro mensual"
        />
        <Button
          title="Transferir dinero"
          onPress={submit}
          loading={saving}
          disabled={!from || !to || from === to}
        />
      </Card>
      {accounts.length < 2 ? (
        <Text style={local.help}>
          Necesitas al menos dos cuentas activas de la misma moneda.
        </Text>
      ) : null}
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    label: { color: colors.ink, fontSize: 12, fontWeight: '800' },
    choices: { gap: 8 },
    choice: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 13,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      backgroundColor: colors.surfaceMuted,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    name: { color: colors.ink, fontWeight: '700' },
    meta: { color: colors.muted, fontSize: 11 },
    notice: {
      color: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: 9,
      padding: 12,
    },
    help: {
      color: colors.muted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
