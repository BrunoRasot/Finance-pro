# Finance Pro Web

Next.js App Router + React + Supabase Auth. Las consultas financieras pasan por NestJS; la web no se conecta directamente a PostgreSQL.

## Desarrollo

1. Copiar `.env.example` a `.env.local` y completar URL y clave **publicable** de Supabase. No usar claves secretas ni contraseñas de base de datos.
2. En Supabase → Authentication → URL Configuration, usar Site URL `http://localhost:3000` y permitir exactamente estas redirecciones:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback?next=/actualizar-contrasena`
3. Desde la raíz, ejecutar `pnpm dev:api` y, en otra terminal, `pnpm dev:web`.
4. Abrir `http://localhost:3000`, registrarse y confirmar el correo en el mismo navegador. El flujo PKCE necesita la cookie del navegador que inició la solicitud.

## Estructura

- `src/app`: rutas, páginas y callback de autenticación.
- `src/features/auth`: formularios y acciones de autenticación.
- `src/features/accounts`: formulario y acción de creación de cuentas.
- `src/features/transactions`: formulario, acción, categorías y validación de movimientos.
- `src/lib`: configuración validada, acceso a Supabase y al backend, validación de entradas.
- `src/components`: elementos compartidos.
- `src/proxy.ts`: renovación de sesión.
- `test`: validación de redirecciones, entradas y precisión monetaria.

Las cookies son HttpOnly, SameSite=Lax y Secure en producción. Cada página privada y acción financiera verifica el usuario con Supabase; NestJS verifica nuevamente el JWT y limita las consultas a su propietario. Los tokens nunca se envían como propiedades de componentes del cliente. No hay caché compartida para las respuestas privadas.

`pnpm --filter @finance-pro/web test`, `typecheck`, `lint` y `build` verifican la aplicación. El registro, la confirmación de correo y la recuperación requieren una prueba manual con un correo propio y la configuración de redirecciones. El proveedor de correo de Supabase tiene restricciones; configurar SMTP para publicar la aplicación.

## Alcance actual

Registro, acceso, cierre de sesión y recuperación de contraseña. Creación, edición, archivado y restauración de cuentas; ingresos y gastos con edición, eliminación e historial filtrable; transferencias entre cuentas de la misma moneda; resumen mensual, presupuestos, metas y aportes, y exportación JSON/CSV. Los saldos incluyen todos los movimientos registrados, también los de fecha futura; los filtros no cambian el saldo.

La creación conserva una clave de idempotencia hasta recibir confirmación. Si el resultado es incierto, bloquea los campos y permite reintentar el mismo envío; revisar el historial antes de cerrar o recargar. La clave y los datos pendientes están en memoria del formulario, no sobreviven a una recarga completa. Después de un éxito se genera una clave nueva y se actualizan detalle y tarjetas.

Prueba manual: iniciar sesión, abrir «Ver movimientos», registrar un ingreso y un gasto, comprobar el saldo, filtrar por fechas y recargar. Las pruebas automatizadas validan importes, fechas, categorías, paginación y centavos negativos; las pruebas PostgreSQL del backend cubren aislamiento e idempotencia concurrente.

Antes de publicar: configurar el dominio HTTPS y callbacks exactos de producción, SMTP, límites de autenticación adecuados al tráfico y observabilidad. Revisar las opciones de contraseña del proyecto Supabase para alinearlas con el mínimo de 12 caracteres de esta web.

Consultar la [guía de lanzamiento y operación](../../docs/release-v1.md). Los contenedores se compilan sin credenciales y reciben la configuración al arrancar.
