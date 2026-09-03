# API de Finance Pro

## Estructura actual

```text
src/
  main.ts                       # Arranque y apagado del proceso
  app.module.ts                 # Composición de módulos y políticas globales
  bootstrap/
    configure-app.ts            # Configuración HTTP usada también en pruebas
  config/
    environment.ts              # Validación y tipos de variables de entorno
    environment.spec.ts
  common/
    http/                       # Identificación de peticiones y errores
    security/                   # Política de acceso y declaración de rutas públicas
  modules/
    health/                     # Estado mínimo del proceso
    accounts/                   # Presentación, aplicación, dominio y persistencia
    transactions/               # Ingresos, gastos, historial y saldo calculado
  infrastructure/database/      # Conexión Prisma y ciclo de vida
  generated/prisma/             # Cliente generado; excluido de Git
test/
  api.e2e.spec.ts                # Pruebas HTTP con la configuración real
```

## Ejecutar

Usar los comandos de la raíz: `pnpm dev:api`, `pnpm test`, `pnpm build`.
Los scripts de pnpm ejecutan la API desde `apps/api`, donde Nest carga `.env`.
Si se ejecuta Node directamente, hacerlo desde esta carpeta: `node dist/main.js`.

## Configuración

| Variable            | Predeterminado | Regla                                                     |
| ------------------- | -------------- | --------------------------------------------------------- |
| `NODE_ENV`          | `development`  | `development`, `test` o `production`                      |
| `HOST`              | `127.0.0.1`    | También permite `0.0.0.0`, `::1` o `::`                   |
| `PORT`              | `3001`         | Entero entre 1 y 65535                                    |
| `CORS_ORIGINS`      | Vacío          | Orígenes exactos separados por comas; HTTPS en producción |
| `RATE_LIMIT_TTL_MS` | `60000`        | Ventana en milisegundos, entre 1000 y 3600000             |
| `RATE_LIMIT_MAX`    | `60`           | Límite por IP y ruta, entre 1 y 10000                     |

Una configuración inválida impide el arranque. Los errores de validación del entorno identifican variables, sin imprimir sus valores.

`DATABASE_URL` define la conexión PostgreSQL. `SUPABASE_URL` es el origen HTTPS del proyecto Supabase, sin barra final. Ambas variables son obligatorias en producción. En desarrollo pueden omitirse, pero no se podrán usar las funcionalidades que dependan de ellas. Solo las pruebas admiten un emisor HTTP en loopback.

## Contrato actual

`GET /api/v1/health/live` devuelve `200` con `{"status":"ok"}`.
Es un control de vida del proceso; no comprueba base de datos ni servicios externos.

`GET /api/v1/health/ready` comprueba conexión con PostgreSQL mediante `SELECT 1`: devuelve 200 o 503 sin detalles internos. No valida el esquema ni comprueba disponibilidad de Supabase.

Las rutas de cuentas están documentadas en [accounts-api.md](../../docs/accounts-api.md), y el registro de ingresos/gastos, la idempotencia, los filtros y el saldo en [transactions-api.md](../../docs/transactions-api.md).

Los errores tienen `statusCode`, `message`, `requestId` y `timestamp`. El identificador también se envía en `X-Request-Id`. Los fallos de servidor usan un mensaje genérico. Los registros de estos fallos contienen evento, identificador y código de estado, sin cuerpo, tokens, consulta ni stack del error.

## Seguridad de esta etapa

- `AccessGuard` requiere un JWT válido en las rutas privadas. Solo las rutas de salud son públicas. Sin `SUPABASE_URL`, el acceso privado permanece bloqueado.
- `SupabaseTokenVerifier` verifica firmas ES256/RS256 con JWKS, emisor, audiencia `authenticated`, caducidad, UUID del usuario y rol. Rechaza sesiones anónimas. No acepta claves `service_role` ni el antiguo esquema HS256. No se necesitan claves privadas para verificar firmas.
- Las consultas de cuentas y movimientos filtran por propietario derivado del JWT; el cuerpo no puede establecer `ownerId`. Ambas tablas tienen RLS habilitado y acceso directo revocado a los roles `anon` y `authenticated`. La conexión privilegiada del backend exige mantener los filtros de propietario. La base no se expone al navegador.
- La verificación JWT es local con claves públicas cacheadas hasta 10 minutos. Cerrar una sesión no revoca inmediatamente un token emitido; se respeta su expiración. Una necesidad de revocación inmediata requerirá verificación de sesión adicional.
- Helmet configura encabezados de seguridad y se deshabilita `X-Powered-By`.
- CORS usa una lista exacta sin credenciales de cookies. CORS limita acceso desde navegadores; no sustituye autenticación ni autorización.
- El parser JSON admite hasta 32 KiB. Los DTO deben ser clases con decoradores de validación; se rechazan campos adicionales y no se convierten tipos implícitamente.
- Throttler usa memoria local, por IP y ruta. Los contadores se reinician al reiniciar el proceso. Antes de escalar a varias instancias, usar almacenamiento compartido y límites en el proxy. El control no sustituye protección contra DDoS.
- No se confía en `X-Forwarded-For`. Configurar proxies de confianza específicos cuando se conozca la infraestructura; de otro modo un proxy hará compartir cuota a sus clientes.
- El proceso escucha localmente por defecto. Para contenedores o pruebas desde un teléfono, configurar `HOST` y la red conscientemente.

## Verificación

Las pruebas cubren configuración, rutas privadas, cabeceras, CORS, validación DTO, JSON inválido, tamaño del cuerpo, errores sanitizados y límites de peticiones. Las rutas de prueba solo existen en `test/` y quedan excluidas de la compilación.

Las pruebas JWT usan claves temporales y un servidor JWKS local; no crean usuarios ni modifican Supabase. Las pruebas de cuentas usan PostgreSQL real en una base cuyo nombre termina en `_test`; borran solo los registros de los usuarios aleatorios creados por esa ejecución.

Para preparar las pruebas de integración, después de `pnpm db:setup` y `pnpm db:up`, ejecutar desde la raíz:

```powershell
docker compose exec -T db createdb -U finance_pro finance_pro_test
pnpm --filter @finance-pro/api db:migrate:test
pnpm db:generate
pnpm test:integration
```

`createdb` solo es necesario la primera vez. `.env.test` contiene la conexión local generada. En CI se proporciona `TEST_DATABASE_URL` mediante el entorno.

La web ya incluye el flujo de acceso. La base de datos del proyecto usa Supabase con TLS verificado; API y web se ejecutan localmente. Antes de desplegarlas, preparar respaldos verificados, un rol PostgreSQL de privilegios mínimos, SMTP, dominio HTTPS y operación del servicio. El usuario de PostgreSQL creado por Docker es exclusivamente para desarrollo local.

## Supabase

1. Completar `apps/api/.env` a partir de `.env.example` con `SUPABASE_URL` y la conexión PostgreSQL `DATABASE_URL`. No versionar los valores reales.
2. Para los comandos de migración, copiar `.env.supabase.example` a `.env.supabase` y completar la conexión directa o Session Pooler en puerto 5432. El script está limitado al proyecto Finance Pro configurado en `scripts/supabase-db.mjs`.
3. Si se necesita el certificado CA, configurar `SUPABASE_CA_CERT` en `.env.supabase`. Para la conexión de ejecución en `.env`, incorporar `sslmode=verify-full` y `sslrootcert` con la ruta del certificado en `DATABASE_URL`; el servicio de ejecución no lee `.env.supabase`.
4. Desde la raíz, ejecutar `pnpm db:check:supabase` y `pnpm db:migrate:supabase`. Este último aplica las migraciones pendientes a la base remota.
5. Ejecutar `pnpm dev:api` y verificar `/api/v1/health/ready`.

Las pruebas de integración siempre usan `TEST_DATABASE_URL` en una base dedicada cuyo nombre termina en `_test`; no usar la conexión de Supabase para pruebas destructivas.
