import { Redirect, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoLinking from 'expo-linking';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { validNewPassword } from '@/lib/password';
import { useAuth } from '@/features/auth/auth-provider';
import { Button, ErrorNotice, Field, Screen } from '@/ui/components';
import { useAppTheme } from '@/features/theme/theme-provider';
import type { Palette } from '@/ui/theme';

export default function LoginScreen() {
  const { colors, dark, preference, setPreference } = useAppTheme();
  const local = useMemo(() => makeStyles(colors), [colors]);
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!authLoading && session) return <Redirect href="/(app)" />;
  async function submit() {
    if (register && !validNewPassword(password))
      return setError(
        'Usa entre 12 y 128 caracteres, con mayúscula, minúscula, número y símbolo.',
      );
    if (register && !acceptedTerms)
      return setError(
        'Debes aceptar los Términos y la Política de privacidad.',
      );
    setLoading(true);
    setError(null);
    const result = register
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              terms_accepted_at: new Date().toISOString(),
              terms_version: '2026-09-08',
            },
          },
        })
      : await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
    setLoading(false);
    if (result.error) return setError(result.error.message);
    if (result.data.session) router.replace('/(app)');
    else
      setError('Revisa tu correo para confirmar la cuenta antes de ingresar.');
  }
  async function recover() {
    if (!email.trim())
      return setError('Escribe tu correo electrónico primero.');
    setLoading(true);
    const redirectTo =
      Platform.OS === 'web'
        ? `${globalThis.location?.origin ?? ''}/reset-password`
        : ExpoLinking.createURL('/reset-password', { scheme: 'financepro' });
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );
    setLoading(false);
    const recoveryMessage =
      recoveryError?.code === 'email_address_not_authorized'
        ? 'Por el momento no podemos enviar el enlace a este correo. Inténtalo más tarde.'
        : recoveryError?.code === 'over_email_send_rate_limit' ||
            recoveryError?.status === 429
          ? 'Se alcanzó el límite temporal de correos. Espera una hora antes de intentarlo nuevamente.'
          : recoveryError?.message;
    setError(
      recoveryError
        ? (recoveryMessage ?? 'No se pudo enviar el enlace.')
        : 'Te enviamos un enlace para restablecer tu contraseña.',
    );
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={local.topbar}>
          <View style={local.brand}>
            <View style={local.mark}>
              <Ionicons name="stats-chart" size={19} color="#10231f" />
            </View>
            <Text style={local.brandText}>financepro</Text>
          </View>
          <Pressable
            accessibilityLabel="Cambiar tema"
            onPress={() =>
              setPreference(
                preference === 'system'
                  ? 'light'
                  : preference === 'light'
                    ? 'dark'
                    : 'system',
              )
            }
            style={local.themeButton}
          >
            <Ionicons
              name={
                preference === 'system'
                  ? 'phone-portrait-outline'
                  : dark
                    ? 'moon-outline'
                    : 'sunny-outline'
              }
              size={18}
              color={colors.ink}
            />
          </Pressable>
        </View>
        <View style={local.hero}>
          <Text style={local.eyebrow}>
            {register ? 'EMPIEZA HOY' : 'BIENVENIDO DE NUEVO'}
          </Text>
          <Text style={local.title}>
            {register
              ? 'Crea tu espacio financiero.'
              : 'Pon tus cuentas en orden.'}
          </Text>
          <Text style={local.subtitle}>
            Cuentas, movimientos, presupuestos y metas en un solo lugar.
          </Text>
        </View>
        <View style={local.feature}>
          <View style={local.featureIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={local.featureTitle}>Tus finanzas son privadas</Text>
            <Text style={local.featureCopy}>
              Tu sesión protege el acceso a toda tu información.
            </Text>
          </View>
        </View>
        <View style={local.form}>
          <Text style={local.formTitle}>
            {register ? 'Datos de tu cuenta' : 'Ingresa a tu cuenta'}
          </Text>
          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="tu@correo.com"
          />
          <View>
            <Field
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={register ? 'new-password' : 'current-password'}
              placeholder={
                register ? '12+ caracteres y un símbolo' : 'Tu contraseña'
              }
            />
            <Pressable
              accessibilityLabel={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              onPress={() => setShowPassword(!showPassword)}
              style={local.eye}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>
          {register ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              style={local.termsRow}
            >
              <Ionicons
                name={acceptedTerms ? 'checkbox' : 'square-outline'}
                size={21}
                color={acceptedTerms ? colors.primary : colors.muted}
              />
              <Text style={local.termsCopy}>
                Acepto los Términos de uso y la Política de privacidad.
              </Text>
            </Pressable>
          ) : null}
          <ErrorNotice message={error} />
          <Button
            title={register ? 'Crear cuenta' : 'Iniciar sesión'}
            onPress={submit}
            loading={loading}
            disabled={
              !email ||
              password.length < (register ? 12 : 1) ||
              (register && !acceptedTerms)
            }
          />
          {!register ? (
            <Pressable onPress={() => void recover()}>
              <Text style={local.textAction}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          ) : null}
          <View style={local.switchRow}>
            <Text style={local.switchCopy}>
              {register ? '¿Ya tienes una cuenta?' : '¿Es tu primera vez?'}
            </Text>
            <Pressable
              onPress={() => {
                setRegister(!register);
                setAcceptedTerms(false);
                setError(null);
              }}
            >
              <Text style={local.switchAction}>
                {register ? 'Inicia sesión' : 'Crea una cuenta'}
              </Text>
            </Pressable>
          </View>
        </View>
        <Text style={local.security}>
          <Ionicons name="lock-closed-outline" size={11} /> Acceso seguro y
          protegido
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    mark: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.lime,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandText: { fontSize: 22, fontWeight: '900', color: colors.ink },
    themeButton: {
      width: 42,
      height: 42,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: { marginTop: 38, gap: 10 },
    eyebrow: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.6,
    },
    title: {
      color: colors.ink,
      fontSize: 36,
      lineHeight: 41,
      fontWeight: '900',
      maxWidth: 440,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: 440,
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 10,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.line,
    },
    featureIcon: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
    featureCopy: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },
    form: {
      gap: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 18,
      borderRadius: 16,
    },
    formTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: '900',
      marginBottom: 2,
    },
    eye: {
      position: 'absolute',
      right: 12,
      bottom: 13,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textAction: {
      color: colors.primary,
      textAlign: 'right',
      fontSize: 12,
      fontWeight: '800',
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },
    termsCopy: {
      color: colors.muted,
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },
    switchCopy: { color: colors.muted, fontSize: 12 },
    switchAction: { color: colors.primary, fontSize: 12, fontWeight: '900' },
    security: {
      color: colors.muted,
      textAlign: 'center',
      fontSize: 11,
      lineHeight: 17,
      marginBottom: 10,
    },
  });
