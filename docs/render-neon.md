# Render + Neon: inicio gratuito y ampliación posterior

Despliegue realizado el 2026-09-08 en los planes gratuitos. El proyecto `finance-pro` de Neon usa PostgreSQL 17 en São Paulo. El Blueprint `finance-pro` de Render publica ambos servicios desde la rama `codex/release-v1-rc1`. No se contrataron servicios de pago.

- Web: <https://finance-pro-web-o6ce.onrender.com>
- API: <https://finance-pro-api-wyv2.onrender.com/api/v1>
- API liveness: <https://finance-pro-api-wyv2.onrender.com/api/v1/health/live>
- API readiness: <https://finance-pro-api-wyv2.onrender.com/api/v1/health/ready>

## Distribución

| Servicio                  | Responsabilidad                                                           |
| ------------------------- | ------------------------------------------------------------------------- |
| Render: `finance-pro-web` | Web Next.js y acciones del servidor                                       |
| Render: `finance-pro-api` | API NestJS compartida por web y teléfono                                  |
| Neon                      | PostgreSQL con cuentas, movimientos, transferencias, presupuestos y metas |
| Supabase Auth existente   | Registro, acceso, confirmación de correo y recuperación                   |

Los usuarios conservan sus identificadores de Supabase; no hay que volver a registrarlos si se trasladan los datos financieros conservando `owner_id`. No eliminar el proyecto Supabase. Neon no reemplaza automáticamente la autenticación ya implementada.

No hace falta comprar dominio para empezar: Render ofrece direcciones HTTPS `*.onrender.com`. Web y API tienen direcciones distintas. Utilizar las URLs que Render asigne realmente, no asumir que los nombres de ejemplo están disponibles.

## Configuración realizada y procedimiento de mantenimiento

1. Las cuentas gratuitas de Render y Neon están conectadas. Neon usa PostgreSQL 17 en AWS South America East 1 (São Paulo).
2. Guardar las conexiones de Neon en un archivo privado usando `deploy/.env.neon.example` como referencia; no pegarlas en el chat ni en Git. El archivo no se carga automáticamente. Usar conexión **directa** para administración, migraciones y respaldos, y conexión **pooled** para la API. Mantener verificación TLS (`sslmode=verify-full`).
3. Los datos del respaldo autorizado del 7 de septiembre se importaron en una base Neon vacía. Se conservaron `_prisma_migrations` y los UUID de propietario. Las cuentas, movimientos, transferencias, presupuestos, metas, aportes y migraciones coincidieron exactamente por cantidad y SHA-256. No usar `migrate reset`.
4. Si se opta expresamente por una base nueva **sin datos**, cargar la conexión directa en `DATABASE_URL` de una terminal temporal y ejecutar `pnpm db:migrate`. Esta alternativa no traslada el historial existente y no es la opción predeterminada.
5. Neon tiene el rol agrupador `finance_app` y un login dedicado limitado para la API. Render guarda solamente su conexión pooled en `DATABASE_URL`; la cuenta administrativa permanece fuera de Render.
6. La rama `codex/release-v1-rc1` está publicada en GitHub. La etiqueta `v1.0.0-rc.1` conserva la candidata validada; la configuración Render/Neon está en el commit posterior `35d08af`.
7. Render usa `render.yaml` mediante el Blueprint `finance-pro`, con dos servicios Free, puerto 10000 y despliegues automáticos apagados. No incluye Render Postgres, cron de pago ni discos.
8. CORS, las URLs públicas y los callbacks de Supabase usan las direcciones reales asignadas por Render.

## Variables y direcciones

| Destino    | Variable                               | Valor                                                  |
| ---------- | -------------------------------------- | ------------------------------------------------------ |
| API Render | `DATABASE_URL`                         | URI pooled de Neon del login limitado                  |
| API Render | `SUPABASE_URL`                         | URL del proyecto Supabase Auth actual                  |
| API Render | `CORS_ORIGINS`                         | `https://finance-pro-web-o6ce.onrender.com`            |
| Web Render | `SUPABASE_URL`                         | Mismo proyecto Supabase Auth                           |
| Web Render | `SUPABASE_PUBLISHABLE_KEY`             | Clave publicable del proyecto, nunca una clave secreta |
| Web Render | `API_BASE_URL`                         | `https://finance-pro-api-wyv2.onrender.com/api/v1`     |
| Web Render | `APP_ORIGIN`                           | `https://finance-pro-web-o6ce.onrender.com`            |
| Móvil      | `EXPO_PUBLIC_API_BASE_URL`             | La misma URL pública de la API con `/api/v1`           |
| Móvil      | `EXPO_PUBLIC_SUPABASE_URL`             | Proyecto Supabase Auth actual                          |
| Móvil      | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Su clave publicable                                    |

Las conexiones entre los dos servicios gratuitos usan HTTPS público: Render Free no recibe tráfico por su red privada. No usar `http://api:3001` de la plantilla Docker Compose ni copiar direcciones internas de Render.

Actualizar Supabase Auth con Site URL de la web y redirecciones exactas:

- `https://finance-pro-web-o6ce.onrender.com/auth/callback`
- `https://finance-pro-web-o6ce.onrender.com/auth/callback?next=/actualizar-contrasena`
- `financepro://reset-password`

El SMTP se configura en Supabase Auth. Los servicios gratuitos de Render restringen puertos SMTP, pero la aplicación usa la API HTTPS de Supabase para los flujos de acceso. La entrega real del correo sigue pendiente de configurar y probar.

## Qué esperar del plan gratuito

Render Free suspende el servicio tras 15 minutos sin tráfico y el primer acceso puede tardar alrededor de un minuto en reactivarlo. Los dos servicios comparten las 750 horas gratuitas mensuales del workspace; no son 750 horas para cada uno. Por eso esta fase sirve para pruebas y uso personal, no para prometer disponibilidad continua. Los límites y precios deben revisarse en el panel antes de contratar.

La API móvil y las llamadas web tienen tiempos de espera menores que una reactivación completa. Tras inactividad puede aparecer un error inicial: esperar a que la API vuelva a estar disponible y reintentar con la misma operación. No crear movimientos nuevos para compensar un resultado incierto.

Neon también tiene cuotas de cómputo y almacenamiento y puede suspender el cómputo por inactividad. El control de Render para la API usa `/api/v1/health/live`, que no consulta PostgreSQL, para evitar activarlo continuamente. Comprobar `/api/v1/health/ready` después de cada migración/despliegue. El monitor periódico de GitHub permanece desactivado: las comprobaciones frecuentes pueden consumir las cuotas gratuitas de Render y Neon.

No guardar respaldos en el disco del servicio Render: es efímero. El timer systemd de `deploy/` pertenece a la alternativa de servidor Linux, no se instala en Render. Conservar respaldos fuera del servicio y verificar restauraciones; la retención de Neon depende del plan y no sustituye la recuperación de Supabase Auth. La programación externa, el cifrado y la retención de copias quedan por configurar antes del uso estable.

## Pasar a planes de pago

Se mantienen las aplicaciones, las URLs y la base existente. Cambiar el tipo de instancia de **ambos servicios** Render a uno de pago y actualizar los dos `plan: free` del Blueprint para que siga reflejando la configuración elegida. Pagar solo el plan del workspace no cambia automáticamente sus instancias Free.

En Neon, ampliar el plan y los límites del proyecto según consumo; revisar la ventana de recuperación. No hace falta trasladar los datos a otro proveedor para este cambio. Después, activar monitoreo/alertas, respaldos externos y revisar capacidad y tiempos de conexión. Antes de aumentar réplicas de la API, sustituir sus límites en memoria por un mecanismo compartido y revisar la topología del proxy.

## Verificación antes de abrir el acceso

El 2026-09-08 `pnpm health:check` confirmó con HTTP 200 el liveness y readiness de la API y la pantalla de acceso web. También se comprobó visualmente la página publicada. Quedan como pruebas manuales con una cuenta de prueba: acceso autenticado, aislamiento entre usuarios, saldos, transferencias, recuperación por correo y aplicación instalada. Conservar por ahora la base original de Supabase como copia de seguridad.

Fuentes oficiales consultadas el 2026-09-08: [Render Free](https://render.com/docs/free), [Blueprints](https://render.com/docs/blueprint-spec), [servicios web y direcciones HTTPS](https://render.com/docs/web-services), [conexiones pooled de Neon](https://neon.com/docs/connect/connection-pooling), [planes de Neon](https://neon.com/pricing).
