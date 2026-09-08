import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { useIdempotentOperation } from '@/features/use-idempotent-operation';
import { amount, today } from '@/lib/finance';
import type { Currency, Goal } from '@/lib/types';
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

export default function GoalsScreen() {
  const { colors } = useAppTheme();
  const local = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('0.00');
  const [currency, setCurrency] = useState<Currency>('PEN');
  const [deadline, setDeadline] = useState('');
  const [contribution, setContribution] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const operation = useIdempotentOperation();
  const locked = saving || operation.pendingPath !== null;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archived, setArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setItems(
        (
          await api<{ items: Goal[] }>(
            `/goals?status=${archived ? 'ARCHIVED' : 'ACTIVE'}`,
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
    if (locked) return;
    setSaving(true);
    try {
      await api(editingId ? `/goals/${editingId}` : '/goals', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: name.trim(),
          ...(editingId ? {} : { currency }),
          targetAmount: target,
          deadline: deadline || null,
        }),
      });
      setName('');
      setTarget('0.00');
      setDeadline('');
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear.');
    } finally {
      setSaving(false);
    }
  }
  function edit(goal: Goal) {
    if (locked) return;
    setName(goal.name);
    setTarget(goal.targetAmount);
    setCurrency(goal.currency);
    setDeadline(goal.deadline ?? '');
    setEditingId(goal.id);
    setShowForm(true);
  }
  async function toggleArchive(goal: Goal) {
    if (locked) return;
    try {
      await api(`/goals/${goal.id}/${archived ? 'restore' : 'archive'}`, {
        method: 'POST',
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  }
  async function add(goal: Goal) {
    const value = contribution[goal.id];
    if (!value) return;
    setSaving(true);
    try {
      await operation.run(`/goals/${goal.id}/contributions`, {
        amount: value,
        date: today(),
        note: '',
      });
      setContribution((current) => ({ ...current, [goal.id]: '' }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aportar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen scroll={false}>
      <View style={local.top}>
        <Heading
          eyebrow="CONSTRUYE TU FUTURO"
          title="Metas"
          subtitle="Define objetivos y registra cada avance."
        />
        <Pressable onPress={() => setShowForm(!showForm)} style={local.add}>
          <Text style={local.addText}>{showForm ? '×' : '+'}</Text>
        </Pressable>
      </View>
      <ErrorNotice message={error} />
      {operation.pendingPath && !saving ? (
        <ErrorNotice message="Reintenta el aporte pendiente con los mismos datos. No cierres esta pantalla hasta confirmar el resultado." />
      ) : null}
      <View style={local.row}>
        <Pressable
          disabled={locked}
          onPress={() => setArchived(false)}
          style={[local.choice, !archived && local.selected]}
        >
          <Text style={local.choiceText}>Activas</Text>
        </Pressable>
        <Pressable
          disabled={locked}
          onPress={() => setArchived(true)}
          style={[local.choice, archived && local.selected]}
        >
          <Text style={local.choiceText}>Archivadas</Text>
        </Pressable>
      </View>
      {showForm ? (
        <Card style={{ gap: 13 }}>
          <Field
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Fondo de emergencia"
          />
          <View style={local.row}>
            <Pressable
              onPress={() => setCurrency('PEN')}
              style={[local.choice, currency === 'PEN' && local.selected]}
            >
              <Text style={local.choiceText}>PEN</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrency('USD')}
              style={[local.choice, currency === 'USD' && local.selected]}
            >
              <Text style={local.choiceText}>USD</Text>
            </Pressable>
          </View>
          <Field
            label="Objetivo"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
          />
          <Field
            label="Fecha objetivo (opcional)"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />
          <Button
            title={editingId ? 'Guardar cambios' : 'Crear meta'}
            onPress={create}
            loading={saving}
            disabled={!name.trim()}
          />
        </Card>
      ) : null}
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
        contentContainerStyle={{ gap: 11, paddingBottom: 20 }}
      >
        {items.map((goal) => (
          <Card key={goal.id} style={{ gap: 11 }}>
            <View style={local.goalTop}>
              <Text style={local.goalName}>{goal.name}</Text>
              <View style={{ flexDirection: 'row', gap: 13 }}>
                <Pressable onPress={() => edit(goal)}>
                  <Text style={local.tag}>EDITAR</Text>
                </Pressable>
                <Pressable onPress={() => void toggleArchive(goal)}>
                  <Text style={local.tag}>
                    {archived ? 'RESTAURAR' : 'ARCHIVAR'}
                  </Text>
                </Pressable>
              </View>
            </View>
            <Text style={local.saved}>
              {amount(goal.savedAmount, goal.currency)}{' '}
              <Text style={local.target}>
                de {amount(goal.targetAmount, goal.currency)}
              </Text>
            </Text>
            <View style={local.track}>
              <View
                style={[
                  local.progress,
                  { width: `${Math.min(100, goal.progressPercent)}%` },
                ]}
              />
            </View>
            <Text style={local.percent}>
              {goal.progressPercent.toLocaleString('es-PE', {
                maximumFractionDigits: 1,
              })}
              % completado
            </Text>
            {!archived ? (
              <View style={local.contribute}>
                <Field
                  editable={!locked}
                  label="Nuevo aporte"
                  value={contribution[goal.id] ?? ''}
                  onChangeText={(v) =>
                    setContribution((current) => ({ ...current, [goal.id]: v }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
                <Button
                  title="Aportar"
                  onPress={() => {
                    void add(goal);
                  }}
                  loading={saving}
                  disabled={
                    !contribution[goal.id] ||
                    (operation.pendingPath !== null &&
                      operation.pendingPath !==
                        `/goals/${goal.id}/contributions`)
                  }
                />
              </View>
            ) : null}
          </Card>
        ))}
        {items.length === 0 ? (
          <Text style={local.empty}>
            Crea una meta para comenzar a ahorrar con un objetivo claro.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    top: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    add: {
      width: 44,
      height: 44,
      borderRadius: 11,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addText: { color: colors.white, fontSize: 26 },
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
    choiceText: { color: colors.ink },
    goalTop: { flexDirection: 'row', justifyContent: 'space-between' },
    goalName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
    tag: { color: colors.primary, fontSize: 10, fontWeight: '800' },
    saved: { color: colors.ink, fontSize: 20, fontWeight: '900' },
    target: { color: colors.muted, fontSize: 11, fontWeight: '500' },
    track: {
      height: 7,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
      overflow: 'hidden',
    },
    progress: { height: 7, backgroundColor: colors.primary },
    percent: { color: colors.muted, fontSize: 10 },
    contribute: { gap: 9 },
    empty: {
      color: colors.muted,
      textAlign: 'center',
      marginTop: 40,
      lineHeight: 20,
    },
  });
