# Registro de cambios

## En desarrollo — Apariencia global

- Modos Claro, Oscuro y Sistema disponibles en navegación y autenticación.
- Preferencia de apariencia persistente por navegador, aplicada desde el HTML del servidor.
- Colores semánticos para paneles, tablas, formularios, navegación y estados; controles nativos adaptados mediante `color-scheme`.
- Contrato de estilos para nuevas pantallas en `docs/themes.md`.

## En desarrollo — Interfaz unificada

- Navegación lateral en escritorio y navegación compacta en móvil, con sección activa y barra superior fija al desplazarse.
- Nuevo estilo compartido para acceso, cuentas, movimientos y resumen: tipografía, tarjetas, formularios, estados vacíos y mensajes.
- Accesos directos a creación de cuenta y registro de movimientos, más estados de carga con la navegación disponible.
- Controles móviles de mayor tamaño, foco visible, enlace para saltar al contenido y respeto a movimiento reducido.
- Se conservan los datos, endpoints y flujos financieros existentes.

## En desarrollo — Resumen mensual

- Endpoint privado `GET /reports/monthly?month=YYYY-MM`, con ingresos, gastos, resultado y categorías por moneda.
- Pantalla `/resumen` con selector de mes, desglose visual, estados vacíos y errores de carga.
- Agregación exacta por usuario y moneda, excluyendo saldos iniciales; usa las fechas de movimientos.
- Pruebas de límites mensuales, años bisiestos, precisión, separación de monedas y aislamiento entre usuarios.
- Sin migraciones adicionales. Presupuestos y metas de ahorro siguen pendientes.

## 2026-09-03 — Web autenticada y movimientos financieros

### Funcionalidad

- Aplicación Next.js con registro, confirmación de correo, inicio/cierre de sesión y recuperación de contraseña mediante Supabase Auth.
- Creación y listado de cuentas financieras en PEN y USD, con detalle privado de cada cuenta.
- Registro de ingresos y gastos con categorías predefinidas, fecha de calendario y descripción opcional.
- Historial paginado con filtros de tipo, categoría e intervalo de fechas.
- Saldo actual y totales de ingresos/gastos calculados en PostgreSQL, sin pérdida de precisión decimal. Las tarjetas de cuentas muestran el saldo actualizado.

### Backend y seguridad

- Módulo NestJS `transactions`, separado en presentación, aplicación, dominio y persistencia.
- Migración `202609030001_create_transactions`: tabla de movimientos, categorías/tipos, índices y restricciones de importe positivo y coherencia de categoría.
- Relación compuesta de cuenta y propietario para impedir movimientos en cuentas de otro usuario.
- Clave de idempotencia por usuario para evitar duplicados en reintentos, incluidos envíos concurrentes; conflicto 409 si se reutiliza con otros datos.
- RLS y revocación del acceso directo desde los roles públicos de Supabase.
- Cookies HttpOnly, validación de identidad en el servidor Next.js y verificación JWT independiente en NestJS. Destinos del callback limitados.
- El formulario mantiene los datos y la clave durante resultados inciertos, y bloquea su edición para reintentar el mismo movimiento.

### Desarrollo y validación

- Scripts del monorepo para ejecutar web y API; CI ampliado a ambas aplicaciones.
- Pruebas web de importes, centavos negativos, fechas, categorías, filtros y redirecciones.
- Pruebas PostgreSQL de aislamiento, saldos exactos, restricciones, RLS e idempotencia concurrente.
- El propietario confirmó manualmente registro, acceso, persistencia de cuentas y funcionamiento de movimientos, historial y saldo.
- Guías de arranque local/Supabase, arquitectura y contratos de cuentas y movimientos actualizadas.

### Límites actuales

- No incluye edición/borrado, transferencias, movimientos programados, categorías personalizadas, presupuestos ni reportes.
- El saldo incluye todos los movimientos registrados, también los fechados en el futuro. Los filtros solo afectan al historial.
- Se permiten saldos calculados negativos; no se mezclan monedas ni se aplican conversiones.
- Un envío pendiente conserva su clave solo mientras el formulario siga montado. Revisar el historial antes de recargar tras un resultado incierto.
- Publicar código en GitHub no despliega web ni API. Las variables reales de entorno y las credenciales permanecen excluidas del repositorio.
