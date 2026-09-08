# API de presupuestos

Base: `http://127.0.0.1:3001/api/v1`. Todas las rutas requieren un JWT válido y responden con `Cache-Control: no-store` cuando incluyen contenido.

## Consultar un mes

`GET /budgets?month=YYYY-MM` devuelve únicamente los presupuestos del usuario autenticado. Cada elemento contiene `amount`, `spent`, `remaining` y `usagePercent`. El gasto se calcula con movimientos `EXPENSE` del mes, moneda y categoría correspondientes. Las transferencias no participan.

## Crear o actualizar

`PUT /budgets` recibe:

```json
{
  "month": "2026-09",
  "currency": "PEN",
  "category": "FOOD",
  "amount": "500.00"
}
```

La combinación usuario, mes, moneda y categoría es única. Repetirla actualiza el límite existente. El importe debe ser positivo, llegar como texto decimal y tener como máximo dos decimales.

Categorías admitidas: `FOOD`, `TRANSPORT`, `HOUSING`, `HEALTH`, `EDUCATION`, `ENTERTAINMENT` y `OTHER`.

## Eliminar

`DELETE /budgets/:id` devuelve 204. Un identificador inexistente o perteneciente a otra persona devuelve 404 para no revelar recursos ajenos.

La tabla tiene RLS habilitado y revoca el acceso directo a los roles públicos de Supabase. La API conecta con PostgreSQL y aplica siempre el propietario obtenido del JWT; nunca acepta `ownerId` del cliente.
