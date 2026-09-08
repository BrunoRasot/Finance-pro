import type { MetadataRoute } from 'next';
import { getConfig } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getConfig().APP_ORIGIN;
  return ['', '/privacidad', '/terminos', '/soporte', '/eliminar-cuenta'].map(
    (path) => ({
      url: `${origin}${path}`,
      changeFrequency: 'monthly' as const,
    }),
  );
}
