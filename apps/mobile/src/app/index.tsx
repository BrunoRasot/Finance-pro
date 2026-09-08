import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/features/theme/theme-provider';

export default function Index() {
  const { colors } = useAppTheme();
  const { session, loading } = useAuth();
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.canvas,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  return <Redirect href={session ? '/(app)' : '/login'} />;
}
