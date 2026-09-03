# API de ingresos y gastos

Base: `/api/v1`. Todas las rutas requieren `Authorization: Bearer <access_token>` de Supabase. La moneda se hereda de la cuenta; no enviar propietario ni moneda en el cuerpo. Cuenta ajena e inexistente responden con el mismo 404.

## Registrar un movimiento

`POST /accounts/<accountId>/transactions`

```json
{
  "type": "EXPENSE",
  "category": "FOOD",
  "amount": "25.50",
  "date": "2026-09-03",
  "description": "Almuerzo",
  "idempotencyKey": "be5a4d2d-1c3f-4e67-b2b1-0a60f630ad16"
}
```

- `amount`: cadena decimal estrictamente positiva, hasta 16 dígitos enteros y 2 decimales. Se rechazan números JSON, negativos, cero y notación científica.
- `date`: fecha de calendario válida `YYYY-MM-DD`, sin hora ni zona horaria, año 0001–9999. No representa la fecha de creación del registro. Se permiten fechas futuras y también se incluyen en el saldo; esta versión no implementa movimientos programados.
- `description`: opcional, por defecto vacía, máximo 250 caracteres después de quitar espacios exteriores.
- `idempotencyKey`: UUID v4 generado una vez por cada operación. Conservarlo al reintentar una solicitud cuyo resultado sea incierto; generar otro solo para un movimiento nuevo.

Respuesta 201: `id`, `accountId`, `type`, `category`, `amount` con dos decimales, `date`, `description`, `idempotencyKey` y `createdAt` UTC. Repetir la misma clave y datos devuelve el mismo movimiento (también 201); usarla con datos distintos o en otra cuenta del mismo usuario responde 409. La unicidad en PostgreSQL evita duplicados incluso con solicitudes simultáneas. `0.1` y `0.10` son el mismo importe.

## Categorías predefinidas

| Tipo    | Categorías                                                        |
| ------- | ----------------------------------------------------------------- |
| INCOME  | SALARY, FREELANCE, OTHER                                          |
| EXPENSE | FOOD, TRANSPORT, HOUSING, HEALTH, EDUCATION, ENTERTAINMENT, OTHER |

Una combinación de tipo y categoría incompatible responde 400. También existe una restricción de base de datos. Las categorías personalizadas quedan fuera de esta etapa.

## Historial

`GET /accounts/<accountId>/transactions?type=EXPENSE&category=FOOD&from=2026-09-01&to=2026-09-30&limit=20&offset=0`

Todos los filtros son opcionales. Las fechas son inclusivas y `from` no puede ser posterior a `to`. Devuelve `{ "items": [], "limit": 20, "offset": 0 }`. Orden: fecha del movimiento, creación e identificador descendentes. Límite 1–100, desplazamiento 0–10000. La paginación por desplazamiento puede variar si se insertan movimientos entre consultas; no representa una instantánea del historial completo.

## Saldo

`GET /accounts/<accountId>/balance`

```json
{
  "accountId": "8a4d2bd1-e4bc-4c3b-9d7a-0bb17f89a8f8",
  "currency": "PEN",
  "openingBalance": "100.00",
  "totalIncome": "50.25",
  "totalExpense": "20.10",
  "balance": "130.15"
}
```

El saldo incluye todos los movimientos registrados, sin filtros de fecha: saldo inicial + ingresos − gastos. Puede ser negativo. Se calcula en una única consulta PostgreSQL, con una instantánea consistente y aritmética decimal exacta. No se mezclan monedas y los totales se devuelven como cadenas, incluso si superan el rango de un importe individual.

## Seguridad y alcance

Se aplican autenticación, validación estricta, límites de peticiones y `Cache-Control: no-store`. La identidad proviene exclusivamente del token. Una clave foránea compuesta impide guardar un movimiento con propietario distinto al de su cuenta. La tabla tiene RLS habilitado y acceso directo revocado a `anon` y `authenticated`: las operaciones pasan por NestJS.

Errores: 400 datos inválidos, 401 acceso inválido, 404 cuenta no accesible, 409 conflicto de idempotencia, 429 límite de solicitudes y 500/503 dependencia o fallo interno saneado.

No hay edición, eliminación ni transferencias todavía. La web consume estos endpoints desde `/cuentas/<accountId>` y muestra saldos calculados tanto en el detalle como en las tarjetas de cuentas.

## Verificación

`pnpm --filter @finance-pro/api db:migrate:test` seguido de `pnpm test:integration` ejecuta las pruebas en la base dedicada cuyo nombre termina en `_test`. Incluyen autenticación, aislamiento entre usuarios, filtros, precisión, reintentos simultáneos y restricciones SQL. No insertan movimientos en Supabase.
