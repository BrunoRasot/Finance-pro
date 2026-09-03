# Finance Pro

Aplicación personal de finanzas para web y móvil, con intención de publicarse más adelante.

## Estado inicial

El backend en `apps/api` incluye NestJS, PostgreSQL con Prisma, verificación JWT de Supabase y creación/consulta de cuentas con aislamiento por usuario. Web, móvil, pantallas de acceso y movimientos financieros siguen pendientes.

## Stack previsto

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
    web/        # Próxima aplicación Next.js
    mobile/     # Próxima aplicación Expo
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

## Iniciar el backend

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

| Comando                 | Función                                      |
| ----------------------- | -------------------------------------------- |
| `pnpm dev:api`          | API con recarga durante desarrollo           |
| `pnpm build`            | Compilar el backend                          |
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

Ver [guía del backend](apps/api/README.md) y [decisiones de arquitectura](docs/architecture.md).

El flujo de GitHub Actions ejecutará formato, lint, tipos, pruebas y compilación al publicar el repositorio en GitHub. No despliega la aplicación.

## Próxima etapa

Crear el flujo de registro/inicio de sesión en un cliente y el módulo de movimientos. La API verifica tokens, pero no incluye todavía pantallas de acceso. Nunca versionar credenciales ni archivos `.env` reales.
