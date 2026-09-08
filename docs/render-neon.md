# Render + Neon: inicio gratuito y ampliación posterior

Elección del propietario, 2026-09-08. Las cuentas de Render y Neon todavía no existen: esta es la configuración preparada, no un despliegue realizado. No se trasladaron datos ni se contrataron servicios.

## Distribución

| Servicio                  | Responsabilidad                                                           |
| ------------------------- | ------------------------------------------------------------------------- |
| Render: `finance-pro-web` | Web Next.js y acciones del servidor                                       |
| Render: `finance-pro-api` | API NestJS compartida por web y teléfono                                  |
| Neon                      | PostgreSQL con cuentas, movimientos, transferencias, presupuestos y metas |
| Supabase Auth existente   | Registro, acceso, confirmación de correo y recuperación                   |

Los usuarios conservan sus identificadores de Supabase; no hay que volver a registrarlos si se trasladan los datos financieros conservando `owner_id`. No eliminar el proyecto Supabase. Neon no reemplaza automáticamente la autenticación ya implementada.

No hace falta comprar dominio para empezar: Render ofrece direcciones HTTPS `*.onrender.com`. Web y API tienen direcciones distintas. Utilizar las URLs que Render asigne realmente, no asumir que los nombres de ejemplo están disponibles.

## Pasos para conectar las cuentas

1. Crear las cuentas gratuitas de Render y Neon. En Neon crear un proyecto con PostgreSQL 17 para mantener compatibilidad con el respaldo y las herramientas ya probadas. Elegir regiones cercanas entre ambos proveedores.
2. Guardar las conexiones de Neon en un archivo privado usando `deploy/.env.neon.example` como referencia; no pegarlas en el chat ni en Git. El archivo no se carga automáticamente. Usar conexión **directa** para administración, migraciones y respaldos, y conexión **pooled** para la API. Mantener verificación TLS (`sslmode=verify-full`).
3. Trasladar los datos existentes antes de apuntar la aplicación a Neon: detener escrituras durante el corte, generar un respaldo reciente de Supabase, importar esquema y datos en una base Neon vacía, conservar `_prisma_migrations` y los UUID de propietario, y comparar los registros. El respaldo del 7 de septiembre es una copia de recuperación, no necesariamente el estado más reciente. No ejecutar primero todas las migraciones sobre el destino si se va a importar también el esquema. No usar `migrate reset`.
4. Si se opta expresamente por una base nueva **sin datos**, cargar la conexión directa en `DATABASE_URL` de una terminal temporal y ejecutar `pnpm db:migrate`. Esta alternativa no traslada el historial existente y no es la opción predeterminada.
5. En Neon, aplicar el SQL de `apps/api/scripts/runtime-role.sql` con la cuenta administrativa y asignar `finance_app` a un login dedicado sin privilegios administrativos. Guardar su conexión pooled en Render como `DATABASE_URL`. Mantener las credenciales administrativas fuera de ambos servicios Render.
6. Subir la rama `codex/release-v1-rc1` a GitHub antes de conectarla a Render. La etiqueta anterior `v1.0.0-rc.1` conserva la candidata validada; la configuración Render/Neon está en un commit posterior. La rama no se ha publicado desde esta preparación.
7. En Render, conectar el repositorio y usar `render.yaml` como Blueprint, o crear primero la API y luego la web con los mismos campos. Seleccionar **Free** en ambos servicios. El Blueprint usa el Dockerfile ya probado y fija el puerto 10000. Los despliegues automáticos quedan apagados para revisar cada publicación. No incluye base Render Postgres, cron de pago ni discos.
8. Completar las variables con las direcciones reales, revisar CORS y callbacks, y desplegar. El usuario deberá autorizar la conexión GitHub y completar la creación de sus cuentas; las credenciales se introducen directamente en los proveedores.

## Variables y direcciones

| Destino    | Variable                               | Valor                                                  |
| ---------- | -------------------------------------- | ------------------------------------------------------ |
| API Render | `DATABASE_URL`                         | URI pooled de Neon del login limitado                  |
| API Render | `SUPABASE_URL`                         | URL del proyecto Supabase Auth actual                  |
| API Render | `CORS_ORIGINS`                         | Origen HTTPS exacto de la web Render                   |
| Web Render | `SUPABASE_URL`                         | Mismo proyecto Supabase Auth                           |
| Web Render | `SUPABASE_PUBLISHABLE_KEY`             | Clave publicable del proyecto, nunca una clave secreta |
| Web Render | `API_BASE_URL`                         | `https://URL-REAL-API.onrender.com/api/v1`             |
| Web Render | `APP_ORIGIN`                           | `https://URL-REAL-WEB.onrender.com`, sin barra final   |
| Móvil      | `EXPO_PUBLIC_API_BASE_URL`             | La misma URL pública de la API con `/api/v1`           |
| Móvil      | `EXPO_PUBLIC_SUPABASE_URL`             | Proyecto Supabase Auth actual                          |
| Móvil      | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Su clave publicable                                    |

Las conexiones entre los dos servicios gratuitos usan HTTPS público: Render Free no recibe tráfico por su red privada. No usar `http://api:3001` de la plantilla Docker Compose ni copiar direcciones internas de Render.

Actualizar Supabase Auth con Site URL de la web y redirecciones exactas:

- `https://URL-REAL-WEB.onrender.com/auth/callback`
- `https://URL-REAL-WEB.onrender.com/auth/callback?next=/actualizar-contrasena`
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

Comprobar readiness de la API, acceso web, inicio de sesión, aislamiento entre usuarios, saldos trasladados, transferencias, recuperación de contraseña y app instalada. Ejecutar `pnpm health:check` con las URLs HTTPS reales una vez activados los servicios. Conservar la base original de Supabase hasta terminar las comprobaciones. La preparación de estos archivos no acredita que Neon o Render estén configurados.

Fuentes oficiales consultadas el 2026-09-08: [Render Free](https://render.com/docs/free), [Blueprints](https://render.com/docs/blueprint-spec), [servicios web y direcciones HTTPS](https://render.com/docs/web-services), [conexiones pooled de Neon](https://neon.com/docs/connect/connection-pooling), [planes de Neon](https://neon.com/pricing).
