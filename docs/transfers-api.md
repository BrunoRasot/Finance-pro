# API de transferencias

Base: `/api/v1`. Todas las rutas requieren `Authorization: Bearer <access_token>` de Supabase.

## Crear una transferencia

`POST /transfers`, con `Content-Type: application/json`:

```json
{
  "fromAccountId": "uuid-origen",
  "toAccountId": "uuid-destino",
  "amount": "150.25",
  "date": "2026-09-05",
  "description": "Ahorro mensual",
  "idempotencyKey": "uuid-v4"
}
```

Las cuentas deben ser diferentes, estar activas, pertenecer al usuario autenticado y utilizar la misma moneda. El importe es una cadena decimal positiva con máximo 16 enteros y dos decimales. La descripción admite hasta 250 caracteres y puede estar vacía.

La API guarda atómicamente un registro de transferencia y dos movimientos enlazados: un gasto en la cuenta de origen y un ingreso en la cuenta de destino. Si cualquier parte falla, no se guarda ninguna. El sistema admite saldos negativos, por lo que no bloquea una transferencia por fondos insuficientes.

La respuesta 201 incluye `id`, cuentas, importe normalizado, fecha, descripción, clave de idempotencia, moneda y `createdAt`. Repetir exactamente la misma solicitud con la misma clave devuelve la transferencia existente; reutilizar la clave con otros datos responde 409, incluso bajo solicitudes simultáneas.

Los movimientos de transferencia aparecen en el historial con la categoría `TRANSFER`, pero no pueden editarse ni eliminarse por separado. Sus importes actualizan los saldos de ambas cuentas y quedan excluidos de ingresos, gastos y resultado mensual para no inflar el reporte.

## Seguridad y errores

La propiedad deriva exclusivamente del JWT. Una cuenta ajena e inexistente produce el mismo 404. PostgreSQL aplica claves foráneas compuestas, restricciones de importe y cuentas diferentes, RLS y acceso directo revocado a los roles públicos.

| Código    | Significado                                                       |
| --------- | ----------------------------------------------------------------- |
| 400       | Datos inválidos, misma cuenta o monedas diferentes                |
| 401       | Token ausente, inválido o expirado                                |
| 404       | Alguna cuenta no está activa o no pertenece al usuario            |
| 409       | Clave de idempotencia reutilizada con datos distintos             |
| 429       | Límite de peticiones excedido                                     |
| 500 / 503 | Fallo interno o dependencia no disponible, sin detalles sensibles |

La web expone el flujo en `/transferencias` y muestra hasta las primeras 100 cuentas activas. El cambio de moneda y la conversión automática quedan fuera de esta versión.
