# Resumen mensual

`GET /api/v1/reports/monthly?month=2026-09`

Requiere JWT Supabase en `Authorization: Bearer <access_token>`. El mes es obligatorio, formato `YYYY-MM`, año 0001–9999. Parámetros adicionales, meses inválidos o repetidos responden 400. Sin autenticación devuelve 401. Se aplica `Cache-Control: no-store` y el límite global de solicitudes.

El resumen reúne todas las cuentas del propietario verificado. Usa la fecha de calendario del movimiento, desde el primer día incluido hasta el primer día del siguiente mes excluido. Incluye movimientos futuros si pertenecen al mes seleccionado.

Siempre devuelve dos grupos, PEN y USD, incluso sin movimientos. Los saldos iniciales no son ingresos. `net` es ingresos menos gastos del mes, no el saldo de las cuentas ni una meta de ahorro.

```json
{
  "month": "2026-09",
  "currencies": [
    {
      "currency": "PEN",
      "income": "100.00",
      "expense": "25.50",
      "net": "74.50",
      "categories": [
        {
          "type": "INCOME",
          "category": "SALARY",
          "total": "100.00",
          "count": "1"
        },
        {
          "type": "EXPENSE",
          "category": "FOOD",
          "total": "25.50",
          "count": "1"
        }
      ]
    },
    {
      "currency": "USD",
      "income": "0.00",
      "expense": "0.00",
      "net": "0.00",
      "categories": []
    }
  ]
}
```

Los importes y conteos son cadenas para evitar pérdida de precisión. PostgreSQL agrega en una consulta con instantánea consistente; el dominio suma los centavos con BigInt. Las categorías se ordenan por tipo, importe descendente y categoría. Nunca se convierten ni se suman monedas distintas.

La web ofrece `/resumen` desde «Ver resumen mensual» en Mis cuentas. El mes inicial usa America/Lima; el selector conserva la elección en la URL. Los porcentajes de las barras usan el total del mismo tipo y moneda, truncado a dos decimales, por lo que pueden no sumar exactamente 100%. Un error de carga se presenta como error, no como un resumen vacío.

No requiere cambios de esquema ni migraciones: consulta las tablas existentes. Las pruebas cubren meses vacíos, límites mensuales, febrero bisiesto, diciembre, cuentas múltiples, moneda, precisión y aislamiento entre propietarios.
