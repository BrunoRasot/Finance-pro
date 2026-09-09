import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '@/features/theme/theme-provider';
import { supabase } from '@/lib/supabase';
import { validNewPassword } from '@/lib/password';
import { Button, ErrorNotice, Field, Screen } from '@/ui/components';
import type { Palette } from '@/ui/theme';

function paramsFromUrl(url: string) {
  const query = url.replace('#', '?').split('?').slice(1).join('&');
  return new URLSearchParams(query);
}

export default function ResetPasswordScreen() {
  const url = Linking.useURL();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function establishRecoverySession() {
      if (!url) return;
      const params = paramsFromUrl(url);
      const code = params.get('code');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          : await supabase.auth.getSession();
      if (result.error) setError(result.error.message);
      else if (result.data.session) setReady(true);
      else setError('El enlace no es válido o ya venció. Solicita uno nuevo.');
    }
    void establishRecoverySession();
  }, [url]);

  async function updatePassword() {
    if (!validNewPassword(password))
      return setError('Usa una contraseña de entre 12 y 128 caracteres.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError(updateError.message);
    router.replace('/(app)');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Ionicons name="stats-chart" size={20} color="#10231f" />
          </View>
          <Text style={styles.brandText}>financepro</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>RECUPERA TU ACCESO</Text>
          <Text style={styles.title}>Crea una contraseña nueva.</Text>
          <Text style={styles.copy}>
            Usa entre 12 y 128 caracteres e incluye una mayúscula, una
            minúscula, un número y un símbolo.
          </Text>
        </View>
        <View style={styles.form}>
          <Field
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
          <Field
            label="Confirma la contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Repítela exactamente"
          />
          <ErrorNotice message={error} />
          <Button
            title={ready ? 'Guardar contraseña' : 'Validando enlace…'}
            onPress={() => void updatePassword()}
            loading={saving}
            disabled={!ready || password.length < 8 || confirm.length < 8}
          />
          <Button
            title="Volver al inicio de sesión"
            onPress={() => router.replace('/login')}
            variant="secondary"
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    mark: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.lime,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandText: { color: colors.ink, fontSize: 22, fontWeight: '900' },
    hero: { marginTop: 45, gap: 10 },
    eyebrow: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.6,
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '900',
    },
    copy: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    form: {
      gap: 16,
      marginTop: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
  });
