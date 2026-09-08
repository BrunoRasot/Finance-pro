# Finance Pro

Aplicación personal de finanzas para web y móvil, con intención de publicarse más adelante.

## Estado actual

Despliegue activo desde el 2026-09-08: **Render para web/API y Neon para PostgreSQL**, en planes gratuitos. Supabase se conserva para autenticación. La web está en <https://finance-pro-web-o6ce.onrender.com> y la API en <https://finance-pro-api-wyv2.onrender.com/api/v1>. Ver [configuración y operación](docs/render-neon.md).

Versión candidata **1.0.0-rc.1**. El cierre técnico y los pasos externos pendientes están registrados en la [guía de lanzamiento](docs/release-v1.md). No es todavía un despliegue público ni una publicación en tiendas.

El backend en `apps/api` incluye NestJS, PostgreSQL con Prisma, verificación JWT de Supabase, cuentas, ingresos/gastos, transferencias atómicas, presupuestos mensuales, metas de ahorro con aportes, exportación de datos, historial filtrable y saldo calculado con aislamiento por usuario. La web en `apps/web` incluye Next.js y las vistas privadas de gestión. La aplicación Expo en `apps/mobile` comparte autenticación, API y datos para ofrecer resumen, administración de cuentas y movimientos, transferencias, presupuestos, metas, exportaciones y temas claro/oscuro en Android e iOS. Ver [contrato de movimientos](docs/transactions-api.md), [transferencias](docs/transfers-api.md), [presupuestos](docs/budgets-api.md), [metas de ahorro](docs/goals-api.md), [exportaciones](docs/exports-api.md) y [guía móvil](apps/mobile/README.md).

## Stack

- Web: Next.js y TypeScript.
- Móvil: React Native, Expo y TypeScript.
- API: NestJS y TypeScript.
- Datos: PostgreSQL y Prisma.
- Autenticación: Supabase Auth.
- Gestión del monorepo: pnpm workspaces.

## Estructura

```text
finance-pro/
  apps/
    web/        # Aplicación Next.js
    mobile/     # Aplicación Expo para Android, iOS y web móvil
    api/        # API NestJS
  packages/     # Futuros paquetes compartidos
```

## Herramientas

- Node.js 24.x.
- pnpm 11.22.0, declarado en package.json.
- Git.
- Visual Studio Code.
- Docker Desktop para PostgreSQL local.

Para abrir el proyecto desde una terminal:

```powershell
cd C:\Users\bdbr2\finance-pro
code .
```

## Iniciar con PostgreSQL local

Desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile
pnpm db:setup
pnpm db:up
pnpm db:migrate
pnpm dev:api
```

Docker Desktop debe estar activo. `db:setup` genera credenciales locales aleatorias sin mostrarlas y conserva valores existentes. Configurar `SUPABASE_URL` en `apps/api/.env` con la URL pública del proyecto (ver `.env.example`). Nunca copiar claves privadas. Sin Supabase configurado, las rutas privadas rechazan el acceso. El proyecto debe usar firmas ES256 o RS256.

Consultar <http://127.0.0.1:3001/api/v1/health/live>: responde `{"status":"ok"}`. Detener con `Ctrl+C`. Si PowerShell bloquea scripts `.ps1`, usar `pnpm.cmd` en lugar de `pnpm`.

<http://127.0.0.1:3001/api/v1/health/ready> comprueba además la conexión PostgreSQL. Ver [contrato de cuentas](docs/accounts-api.md) para las rutas privadas.

## Comandos desde la raíz

Si el backend ya está configurado para Supabase, no se necesita Docker para ejecutar la aplicación. Desde la raíz, ejecutar `pnpm dev` para iniciar una única API y la web. Esa API también queda disponible para el teléfono en la red local. En otra terminal se puede ejecutar `pnpm dev:mobile`; no se debe iniciar además `pnpm dev:api:mobile`. La conexión requiere internet. Para configurar una instalación nueva con Supabase, consultar [la guía del backend](apps/api/README.md#supabase).

Para iniciar la web, completar `apps/web/.env.local` siguiendo [la guía web](apps/web/README.md), mantener la API ejecutándose y abrir otra terminal con `pnpm dev:web`. Visitar `http://localhost:3000`.

| Comando                 | Función                                      |
| ----------------------- | -------------------------------------------- |
| `pnpm dev`              | API compartida y web durante desarrollo      |
| `pnpm dev:api`          | Solo la API con recarga durante desarrollo   |
| `pnpm dev:web`          | Solo la web con recarga durante desarrollo   |
| `pnpm dev:mobile`       | Expo con código QR para Android y iOS        |
| `pnpm dev:api:mobile`   | API temporalmente accesible en la red local  |
| `pnpm build`            | Compilar API y web                           |
| `pnpm start:web`        | Ejecutar la web compilada                    |
| `pnpm start:api`        | Ejecutar el backend compilado                |
| `pnpm typecheck`        | Revisar tipos, incluidas las pruebas         |
| `pnpm lint`             | Análisis estático sin modificar archivos     |
| `pnpm test`             | Pruebas de configuración e integración HTTP  |
| `pnpm format:check`     | Revisar formato                              |
| `pnpm format`           | Aplicar formato                              |
| `pnpm db:up`            | Iniciar PostgreSQL local                     |
| `pnpm db:stop`          | Detener PostgreSQL conservando datos         |
| `pnpm db:generate`      | Generar el cliente Prisma                    |
| `pnpm db:migrate`       | Aplicar migraciones pendientes               |
| `pnpm test:integration` | Probar cuentas con PostgreSQL y JWT firmados |

Ver [guía del backend](apps/api/README.md), [guía de la web](apps/web/README.md), [decisiones de arquitectura](docs/architecture.md) y [registro de cambios](CHANGELOG.md).

El flujo de GitHub Actions ejecutará formato, lint, tipos, pruebas y compilación al publicar el repositorio en GitHub. No despliega la aplicación.

## Próxima etapa

El recorrido de registro, acceso, cuentas, ingresos, gastos, historial y saldo fue validado manualmente por el propietario del proyecto. La candidata incluye el resumen mensual, transferencias, presupuestos, metas, exportación y aplicación móvil. `pnpm verify:release` ejecuta formato, lint, tipos, pruebas, simulacro de recuperación y compilaciones; requiere una base PostgreSQL de pruebas migrada, Node 24, pnpm 11 y herramientas PostgreSQL 17. El despliegue y la prueba del instalador móvil se completan siguiendo [release-v1.md](docs/release-v1.md). Nunca versionar credenciales, respaldos ni archivos `.env` reales.
