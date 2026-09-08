function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Falta la variable pública ${name}`);
  return value;
}
export const config = {
  supabaseUrl: required(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseKey: required(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  apiBaseUrl: required(
    'EXPO_PUBLIC_API_BASE_URL',
    process.env.EXPO_PUBLIC_API_BASE_URL,
  ).replace(/\/$/, ''),
  webOrigin: (
    process.env.EXPO_PUBLIC_WEB_ORIGIN ??
    'https://finance-pro-web-o6ce.onrender.com'
  ).replace(/\/$/, ''),
};
