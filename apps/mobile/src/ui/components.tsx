import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/features/theme/theme-provider';
import { spacing, type Palette } from './theme';

function useStyles() {
  const { colors } = useAppTheme();
  return { colors, styles: useMemo(() => makeStyles(colors), [colors]) };
}
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const { styles } = useStyles();
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const { colors, styles } = useStyles();
  return (
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>
        {title}
        <Text style={{ color: colors.primary }}>.</Text>
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  const { styles } = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors, styles } = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}
export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress(): void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const { colors, styles } = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || disabled) && { opacity: 0.65 },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant !== 'primary' && {
              color: variant === 'danger' ? colors.danger : colors.primary,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function ErrorNotice({ message }: { message: string | null }) {
  const { styles } = useStyles();
  return message ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.canvas },
    scroll: { flexGrow: 1 },
    content: { flex: 1, padding: spacing.lg, gap: spacing.md },
    heading: { marginBottom: spacing.sm },
    eyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 7 },
    subtitle: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 7,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    field: { gap: 7 },
    label: { color: colors.ink, fontSize: 12, fontWeight: '700' },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 10,
      paddingHorizontal: 13,
      backgroundColor: colors.surfaceMuted,
      color: colors.ink,
    },
    button: {
      minHeight: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    primary: { backgroundColor: colors.primary },
    secondary: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.line,
    },
    danger: {
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    buttonText: { color: colors.white, fontWeight: '800', fontSize: 14 },
    error: {
      color: colors.danger,
      backgroundColor: colors.dangerSoft,
      padding: 11,
      borderRadius: 8,
      fontSize: 12,
    },
  });
