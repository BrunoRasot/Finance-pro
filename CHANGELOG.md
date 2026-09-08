# Registro de cambios

## 1.0.0-rc.1 — 2026-09-07

- Candidata que integra web, API y móvil, con cuentas, movimientos, transferencias, presupuestos, metas y exportaciones.
- Reintentos del móvil conservan cuerpo y clave hasta confirmar el resultado; evitan envíos simultáneos y bloquean cambios durante una operación pendiente. El estado se conserva mientras la pantalla permanece abierta.
- Importes móviles con precisión decimal al mostrarse, UUID mediante Expo Crypto y contraseñas nuevas de 12 a 128 caracteres, igual que en la web.
- Pruebas móviles de precisión, contraseñas y reintentos; pruebas del monitor y de privacidad de registros HTTP.
- Correcciones acotadas de dependencias `uuid` y `decode-uri-component`, con pruebas de interoperabilidad de Expo Router y xcode.
- Respaldo PostgreSQL con instantánea consistente, huellas SHA-256 por tabla, comprobación de integridad y restauración solo en una base vacía de pruebas. Simulacro con protección contra sobrescritura.
- Rol de ejecución sin permisos administrativos, probado contra las operaciones financieras; su activación en producción queda documentada por separado.
- Contenedores para web/API, ejemplo de proxy HTTPS, comprobaciones de salud, rotación de logs y configuración de respaldo diario para un servidor Linux.
- CI amplía la validación al simulacro de recuperación y paquetes Android/iOS. Perfiles EAS preparados para instalador de prueba y producción.
- La versión estable queda pendiente de alojamiento, HTTPS, SMTP, activación de operación y prueba en dispositivo; no se marca como publicada.

## En desarrollo — Aplicación móvil

- Nueva aplicación Expo SDK 57 con React Native, TypeScript y navegación nativa.
- Registro, acceso y sesión persistente mediante Supabase con renovación automática.
- Resumen mensual, cuentas, saldos, historial, nuevos movimientos, transferencias, metas y aportes conectados a la API existente.
- Configuración separada para Android, iOS y web, sin claves privadas dentro del cliente.
- Identificadores `com.brunorasot.financepro` y diseño adaptable basado en la interfaz de Finance Pro.

## En desarrollo — Exportación de datos

- Respaldo JSON versionado con cuentas, movimientos, transferencias, presupuestos, metas y aportes.
- Historial CSV compatible con hojas de cálculo y protegido contra inyección de fórmulas.
- Descargas autenticadas, sin caché, limitadas a los datos del propietario y a 50 000 registros.
- Nueva pantalla `/exportar` de ancho completo con acceso desde la navegación principal.

## En desarrollo — Metas de ahorro

- Metas en PEN o USD con objetivo, fecha opcional y progreso calculado.
- Aportes independientes con precisión decimal e idempotencia concurrente.
- Edición con moneda inmutable, archivado reversible y bloqueo de aportes a metas archivadas.
- Nueva pantalla `/metas` de ancho completo con acciones únicas y lista desplazable.

## En desarrollo — Presupuestos

- Límites mensuales por categoría de gasto y moneda con actualización por combinación única.
- Consumo, importe disponible, porcentaje utilizado y estado excedido calculados con movimientos reales.
- Aislamiento por propietario, precisión decimal, validación estricta, RLS y eliminación segura.
- Nueva pantalla `/presupuestos` de ancho completo con lista desplazable y formulario fijo.

## En desarrollo — Transferencias

- Transferencias atómicas entre cuentas activas del mismo propietario y moneda.
- Registro enlazado de salida y entrada, con precisión decimal e idempotencia concurrente.
- Los movimientos actualizan saldos, pero se excluyen del ingreso y gasto mensual.
- Categoría de sistema `TRANSFER`, protegida contra creación, edición o eliminación manual.
- Nueva pantalla `/transferencias`, selector de origen/destino y estados seguros de reintento.
- Migraciones separadas para el enum y las tablas/restricciones de PostgreSQL.
- Filtro `TRANSFER` disponible en el historial sin habilitar mantenimiento manual.
- Arranque coordinado con `pnpm dev`: espera a que la API esté lista antes de iniciar la web y detiene ambos servicios como una unidad.

## En desarrollo — Mantenimiento de cuentas

- Edición de nombre, tipo y saldo inicial con moneda inmutable para proteger el historial.
- Archivado reversible que conserva movimientos y bloquea nueva actividad hasta restaurar la cuenta.
- Vistas separadas de cuentas activas y archivadas, con restauración desde la tabla.
- Migración aditiva `202609050001_archive_accounts` e índices por propietario y estado.
- Autorización uniforme por propietario y pruebas de aislamiento, idempotencia y conservación de datos.

## En desarrollo — Mantenimiento de movimientos

- Edición segura de tipo, categoría, importe, fecha y descripción, limitada al propietario.
- Eliminación permanente con confirmación explícita y respuesta uniforme para recursos ajenos o inexistentes.
- Actualización automática del historial, saldo de cuentas y resumen mensual.
- Interfaz accesible y adaptable para editar o eliminar desde el historial.

## En desarrollo — Apariencia global

- Modos Claro, Oscuro y Sistema disponibles en navegación y autenticación.
- Preferencia de apariencia persistente por navegador, aplicada desde el HTML del servidor.
- Colores semánticos para paneles, tablas, formularios, navegación y estados; controles nativos adaptados mediante `color-scheme`.
- Contrato de estilos para nuevas pantallas en `docs/themes.md`.

## En desarrollo — Interfaz unificada

- Elimina accesos duplicados a cuentas, resumen y creación de movimientos; cada acción conserva un único punto claro dentro de su contexto.
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
