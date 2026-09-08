# API de metas de ahorro

Base: `http://127.0.0.1:3001/api/v1`. Todas las rutas requieren un JWT válido y aíslan los registros mediante el propietario verificado.

- `POST /goals`: crea una meta con `name`, `currency`, `targetAmount` y `deadline` opcional.
- `GET /goals?status=ACTIVE|ARCHIVED`: lista metas con ahorro acumulado, importe restante y porcentaje de progreso.
- `PATCH /goals/:id`: modifica nombre, objetivo y fecha. La moneda permanece inmutable para conservar la coherencia de los aportes.
- `POST /goals/:id/contributions`: registra un aporte con importe, fecha, nota y clave UUID v4 de idempotencia.
- `POST /goals/:id/archive` y `POST /goals/:id/restore`: ocultan o restauran la meta sin perder aportes.

Los importes viajan como texto decimal positivo con hasta dos decimales. Los aportes se almacenan como registros independientes y una restricción única por propietario evita duplicados durante reintentos concurrentes. Una meta archivada no admite nuevos aportes.

Las tablas `savings_goals` y `goal_contributions` tienen RLS habilitado y acceso directo revocado para roles públicos de Supabase.
