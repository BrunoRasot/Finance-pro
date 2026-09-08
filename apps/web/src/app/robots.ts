import type { MetadataRoute } from 'next';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const origin = getConfig().APP_ORIGIN;
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacidad', '/terminos', '/soporte', '/eliminar-cuenta'],
      disallow: [
        '/cuentas',
        '/resumen',
        '/transferencias',
        '/presupuestos',
        '/metas',
        '/exportar',
        '/configuracion',
        '/descargas',
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
