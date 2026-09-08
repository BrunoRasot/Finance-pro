# Finance Pro 1.0.0-rc.1

Estado: candidata para validación, sin lanzamiento público. Fecha de revisión: 2026-09-08.

El propietario eligió **Render + Neon**, inicialmente gratuitos y más adelante de pago. El 2026-09-08 se desplegaron web y API en Render, se trasladaron los datos financieros a Neon y se verificaron las siete tablas contra el respaldo autorizado. Supabase permanece como autenticación. La configuración operativa está en [render-neon.md](render-neon.md); la guía de servidor Linux de este documento queda como alternativa.

## Evidencia y condiciones de salida

El 2026-09-08 se verificó el arranque de las imágenes Docker de web y API sin root, las ocho migraciones sobre PostgreSQL del contenedor y los tres controles del monitor con respuesta 200. En navegador se revisaron la pantalla de acceso, la navegación a recuperación y la redirección de `/cuentas` sin sesión. Esta prueba usó configuración pública ficticia y no valida el envío de correos ni el acceso autenticado de producción.

La verificación completa del 2026-09-07 terminó con formato, lint, tipos y **155 pruebas aprobadas**: 48 de API, 19 de web, 8 de móvil, 2 del monitor y 78 de integración. También pasaron el simulacro de recuperación y las compilaciones. La auditoría de dependencias de producción no reportó vulnerabilidades conocidas después de las correcciones.

La candidata reúne las funciones de v1. Las pruebas locales comprueban web/API/móvil, precisión monetaria, reintentos, autorización por usuario y recuperación. El registro previo del propietario acredita el recorrido básico de la web; no se da por probado el instalador móvil ni el correo de producción.

| Control                                                       | Estado                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Ocho migraciones sobre PostgreSQL 17 vacío                    | Verificado                                                             |
| 78 pruebas de integración con PostgreSQL y JWT firmados       | Verificado                                                             |
| Las mismas 78 pruebas con rol sin privilegios administrativos | Verificado                                                             |
| Compilación web y API; paquetes Android/iOS/web               | Verificado; repetir con cualquier cambio posterior                     |
| Respaldo sintético y comparación exacta al restaurar          | Verificado, siete tablas y protección de sobrescritura                 |
| Respaldo real de Finance Pro en Supabase y restauración local | Verificado con autorización del propietario; datos remotos sin cambios |
| Hosting y HTTPS público en Render + Neon                      | Desplegado y verificado; dominio propio pendiente                      |
| SMTP y recorrido completo de correos                          | Pendiente de proveedor/configuración                                   |
| APK/IPA firmado y prueba en teléfono                          | Exportación validada; build EAS, firma y dispositivo pendientes        |
| Activar respaldo programado, copia externa y alertas          | Workflow cifrado preparado; secretos y activación pendientes           |
| Rol limitado en producción                                    | Aplicado en Neon y usado por la API de Render                          |
| Privacidad, términos, soporte y eliminación de cuenta         | Implementado en web y enlazado desde web y móvil                       |

No cambiar a `1.0.0` estable ni crear una etiqueta estable mientras los controles externos permanezcan pendientes. El número visible de Expo es `1.0.0`, reservado para el futuro binario; los paquetes del repositorio se identifican como `1.0.0-rc.1`.

## Verificación reproducible

1. Usar Node 24, pnpm 11.22 y PostgreSQL 17. Preparar una base exclusiva cuyo nombre termine en `_test`; `TEST_DATABASE_URL` debe llegar por entorno. El rol de pruebas del simulacro requiere crear bases y roles, exclusivamente en el servidor de pruebas.
2. Ejecutar `pnpm install --frozen-lockfile`, `pnpm db:generate` y `pnpm --filter @finance-pro/api db:migrate:test`.
3. Con `pg_dump` y `pg_restore` 17 en PATH, ejecutar `pnpm verify:release`. Se detiene ante cualquier fallo.
4. Para CI, `.github/workflows/backend.yml` usa PostgreSQL 17 y ejecuta el mismo conjunto de controles. Los valores públicos de Expo usados en CI son marcadores para compilar, nunca configuración de despliegue.

`pnpm test:recovery` crea datos sintéticos relacionados, respalda una instantánea, crea una base nueva con sufijo `_restore_test`, restaura, compara cada fila con SHA-256 y rechaza sobreescrituras. Elimina únicamente sus propios datos sintéticos y la base que creó; conserva los artefactos de prueba en `.release-local`, excluido de Git. No usar una base real con ese comando.

## Despliegue de web y API

La web está en `https://finance-pro-web-o6ce.onrender.com` y la API en
`https://finance-pro-api-wyv2.onrender.com/api/v1`. La base financiera está en
Neon y Supabase conserva la autenticación. La guía operativa actual se encuentra
en [render-neon.md](render-neon.md).

La configuración es portable para un servidor Linux con Docker. No se ha contratado ni seleccionado un proveedor. No se incluyen credenciales en las imágenes.

1. Configurar la base de producción y probar un respaldo antes de aplicar migraciones. El administrador usa `pnpm db:migrate:supabase`; no ejecutar migraciones con la cuenta del servidor web ni al arrancar cada réplica.
2. Copiar `deploy/.env.api.example` a `deploy/.env.api` y `deploy/.env.web.example` a `deploy/.env.web`. Completar valores privados fuera de Git. Si PostgreSQL requiere una CA privada, montarla de solo lectura dentro del contenedor e indicar su ruta interna en `sslrootcert`; no copiar certificados al construir la imagen.
3. Establecer `APP_ORIGIN=https://DOMINIO` y CORS exacto. La web usa internamente `http://api:3001/api/v1` en la red Docker; el teléfono usa `https://DOMINIO/api/v1`. No usar la IP de la computadora como URL de la app publicada.
4. Ejecutar `docker compose -f deploy/compose.yaml build` y `docker compose -f deploy/compose.yaml up -d --wait`. El ejemplo liga los puertos al loopback del servidor.
5. Instalar un proxy HTTPS del proveedor o Caddy en el host. `deploy/Caddyfile.example` envía `/api/v1/*` a 3001 y el resto a 3000. Registrar el dominio, DNS y certificados antes de abrir el servicio al público. Revisar la topología de proxy y límites por IP: actualmente la API no confía en cabeceras reenviadas; los usuarios que llegan por la web/proxy pueden compartir cuota. La plantilla es para una instancia, con límites en memoria.
6. Configurar las URLs exactas en Supabase Auth: `https://DOMINIO/auth/callback`, `https://DOMINIO/auth/callback?next=/actualizar-contrasena` y `financepro://reset-password`. Establecer Site URL HTTPS y conectar SMTP con remitente verificado. Probar registro, confirmación, recuperación y enlaces vencidos con el correo del propietario.
7. Ejecutar `pnpm health:check` con `MONITOR_API_BASE_URL=https://DOMINIO/api/v1` y `MONITOR_WEB_ORIGIN=https://DOMINIO`, y completar el recorrido manual indicado abajo.

La imagen incluye las dependencias de construcción para simplificar el monorepo; ejecuta la aplicación como usuario `node`, sin capacidades adicionales. Se puede optimizar su tamaño en otra versión. Las imágenes construidas aquí son locales; no se han subido a un registro.

## Roles de base de datos

`apps/api/scripts/runtime-role.sql` crea el grupo no-login `finance_app`, concede solo uso del esquema y CRUD de las seis tablas financieras y crea una política RLS exclusiva de ese grupo. Mantiene la arquitectura existente: la API valida el JWT y filtra por propietario; la política del backend permite acceder a las filas necesarias y no crea aislamiento por usuario dentro de PostgreSQL.

El administrador debe crear un login dedicado con contraseña segura, sin privilegios de superusuario, creación de bases/roles, replicación ni BYPASSRLS, y asignarle `finance_app`. No añadir `anon` ni `authenticated` al grupo. Usar ese login en `DATABASE_URL` de ejecución y conservar la conexión administrativa solo para migraciones y respaldos. No se conceden permisos sobre `_prisma_migrations` ni Supabase Auth. Revisar nuevas tablas y reaplicar permisos tras migraciones futuras.

El SQL y las operaciones financieras se probaron con un login no propietario local. La conexión existente a Supabase no fue reemplazada.

## Respaldo y recuperación

Desde la raíz, `pnpm db:backup:supabase` usa la conexión TLS verificada de `apps/api/.env.supabase` y crea un archivo nuevo dentro de `backups/`. Nunca imprime credenciales ni filas. El respaldo real de esta revisión fue autorizado y comparado mediante una restauración temporal local; esa base de verificación se eliminó al terminar.

El archivo `.dump` contiene el esquema público de la aplicación. Su `.dump.json` contiene fecha, hash del archivo y conteos/huellas por tabla. Conservar ambos juntos en almacenamiento privado. No subirlos a Git ni adjuntarlos a tickets. El SHA-256 detecta corrupción accidental; no cifra ni autentica un archivo frente a alguien que puede alterar también el manifiesto.

El respaldo **no incluye usuarios de Supabase Auth, contraseñas, almacenamiento de archivos, secretos ni configuración SMTP**. Para recuperación completa del servicio, configurar además el respaldo de plataforma/Supabase y conservar la configuración en un gestor de secretos. La exportación JSON del usuario tampoco reemplaza este procedimiento.

Para otro entorno, desde `apps/api`:

```sh
# Definir BACKUP_DATABASE_URL por un gestor de secretos o archivo privado.
node scripts/backup.mjs create /ruta/privada/finance-pro-fecha.dump

# Preparar una base VACÍA cuyo nombre termine en _restore_test.
# Definir RESTORE_DATABASE_URL hacia esa base, nunca hacia producción.
node scripts/backup.mjs verify /ruta/privada/finance-pro-fecha.dump
```

Las conexiones remotas requieren `sslmode=verify-full`. Las políticas pueden requerir que exista el grupo `finance_app` en el clúster de recuperación. La restauración descarta únicamente el esquema `public` vacío sin CASCADE y usa una transacción única. Si existen tablas, tipos o funciones, rechaza la operación. La comparación incluye los datos de seis tablas y el historial de migraciones. El corte/retorno a producción se realiza solo después de verificar la copia y conservar la base original.

`encrypted-backup.mjs` crea una copia con AES-256-GCM y elimina los archivos
temporales sin cifrar. `.github/workflows/backup.yml` prepara una ejecución diaria
con artefactos privados de 14 días. Para activarla hay que guardar
`BACKUP_DATABASE_URL` y una clave `BACKUP_ENCRYPTION_KEY` de al menos 32 caracteres
en GitHub Actions, conservar esa clave también en un gestor de contraseñas y
establecer `PRODUCTION_BACKUP_ENABLED=true`. Sin esa clave no se puede recuperar
la copia.

`daily-backup.mjs` y los archivos `deploy/finance-pro-backup.service`/`.timer`
quedan como alternativa para un servidor Linux propio.

Configurar copia cifrada fuera del servidor, retención y alerta por respaldo fallido/antiguo antes de abrir producción. No se borra automáticamente ningún respaldo. Verificar restauración periódicamente y antes de cambios de esquema.

## Monitoreo y respuesta

La API registra errores sanitizados. `REQUEST_LOG_ENABLED=true` agrega identificador de petición, método, estado y duración, sin URL, IP, cuerpo ni token. Docker limita cada servicio a tres archivos de 10 MB. El registro no constituye un servicio externo de alertas.

El monitor comprueba vida de la API, conexión a la base y respuesta de la pantalla de acceso, con tiempo límite de 10 segundos. `.github/workflows/monitor.yml` queda desactivado hasta configurar las variables `PRODUCTION_MONITOR_ENABLED=true`, `MONITOR_API_BASE_URL` y `MONITOR_WEB_ORIGIN`. Al estar publicado en la rama predeterminada, solicita comprobaciones cada 15 minutos; GitHub puede retrasarlas. Activar las notificaciones de fallos de Actions y comprobar una falla controlada. Para SLA estricto, conectar un monitor del proveedor.

Ante 5xx o fallo de readiness: consultar el identificador de petición, disponibilidad de PostgreSQL, límites de conexiones y migraciones. Ante 429: revisar carga y límites antes de aumentarlos. Ante un resultado incierto de una operación: revisar historial y reintentar con la misma clave; no crear otra operación para compensarla sin confirmar el resultado.

## Prueba de aceptación en web y móvil

Usar cuentas/datos de prueba y registrar fecha, plataforma, resultado y evidencia. Esta tabla es un protocolo pendiente, no una afirmación de pruebas realizadas.

| Caso                                            | Resultado esperado                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Registro, confirmación, acceso y cierre         | Solo entra el usuario confirmado; cerrar impide acceder a vistas privadas    |
| Recuperación y enlace vencido                   | Contraseña nueva de 12–128 caracteres; errores claros para enlaces inválidos |
| Dos usuarios y acceso a IDs ajenos              | No se ven ni modifican datos ajenos                                          |
| Ingreso 100.01 y gasto 20.02                    | Diferencia exacta de 79.99; saldo coherente en web y móvil                   |
| Edición/eliminación y cuenta archivada          | Recalcula saldo; archivado conserva historial y bloquea nueva actividad      |
| Transferencia 12.01                             | Un débito y un crédito; no cuenta como ingreso/gasto del resumen             |
| Pérdida de conexión durante envío y doble toque | Se confirma una sola operación al reintentar sin salir de la pantalla        |
| Presupuesto y meta con aporte                   | Consumo y progreso correctos, sin mezclar PEN y USD                          |
| Copia técnica / hoja de cálculo                 | Descarga privada con datos del usuario y centavos exactos                    |
| Eliminación de cuenta                           | Borra identidad y datos del usuario sin afectar otras cuentas                |
| Tema claro/oscuro, teclado, pantalla pequeña    | Controles utilizables y errores visibles                                     |

`eas.json` define entornos separados `preview` y `production`. Asociar la cuenta
Expo/proyecto y configurar `EXPO_PUBLIC_API_BASE_URL`,
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
`EXPO_PUBLIC_WEB_ORIGIN` antes de ejecutar el build. Los pasos y URLs para tiendas
están en [mobile-store-release.md](mobile-store-release.md). Los paquetes Hermes
exportados no son un APK/IPA ni validan enlaces o firma.

## Cierre y reversión

Conservar esta candidata en Git. Tras completar los controles externos, actualizar versión/documentación, ejecutar la verificación completa y etiquetar el commit exacto como `v1.0.0`. Para revertir un despliegue, volver a las imágenes del commit anterior; no borrar tablas ni ejecutar migraciones inversas de forma automática. Si una migración rompe compatibilidad, detener escrituras y preparar un plan de recuperación verificado antes de cambiar de base.

Referencias: [pg_dump e instantáneas](https://www.postgresql.org/docs/17/app-pgdump.html), [perfiles EAS](https://docs.expo.dev/build/eas-json/), [APK de prueba](https://docs.expo.dev/build-reference/apk/), [proxy Caddy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
