# PostgreSQL de Supabase para desarrollo

Proyecto previsto: `dwzmnnyriehtcceugnbz`. La base local se conserva para pruebas.

## Configurar sin publicar secretos

1. En Supabase, abrir el proyecto y seleccionar **Connect → Session pooler**.
2. Copiar la URI PostgreSQL, puerto 5432, y sustituir el marcador de contraseña por la contraseña de la base. Codificar caracteres especiales de la contraseña en formato URL.
3. Guardar `DATABASE_URL=...` en `apps/api/.env.supabase`, tomando `.env.supabase.example` como referencia. Este archivo está excluido de Git. No compartir la cadena en el chat.
4. Ejecutar desde la raíz `pnpm db:check:supabase`.
5. Si la comprobación es correcta, ejecutar `pnpm db:migrate:supabase`.

La URL HTTPS del proyecto y las claves de la API no sustituyen la conexión PostgreSQL. No se reinicia ni se vacía ninguna base. El script limita el destino al proyecto indicado y exige TLS con verificación del certificado; una red sin acceso directo IPv6 puede usar el Session pooler.

Si aparece `SELF_SIGNED_CERT_IN_CHAIN`, descargar el certificado CA desde **Database → Settings → SSL Configuration** y añadir `SUPABASE_CA_CERT=certs/supabase-ca.crt` a `.env.supabase`, usando la ruta real del archivo (relativa a `apps/api` o absoluta). El script lo utiliza tanto para comprobar como para migrar. No desactivar la verificación TLS. Al cambiar la conexión del backend, incluir también `sslrootcert` con la ruta del certificado en su `DATABASE_URL`.

## Migraciones

Se crean los tipos y la tabla `accounts`. Una segunda migración habilita RLS y retira permisos de tabla a los roles `anon` y `authenticated`, si existen. Esto evita que la Data API de Supabase permita saltarse la autorización de NestJS. No hay políticas de acceso directo para navegadores.

El backend debe usar un rol de servidor apropiado; actualmente el entorno de desarrollo utiliza el rol propietario de la tabla, que no está sujeto a RLS. La API sigue filtrando por propietario del JWT. Antes de producción separar roles de migración y ejecución con privilegios mínimos.

Si ya existe una tabla `accounts` sin historial Prisma, el script detiene la migración para revisar el conflicto. No usar `migrate reset` ni sobrescribir tablas para resolverlo.

## Cambiar el backend

Después de aplicar y verificar las migraciones, configurar `DATABASE_URL` en `apps/api/.env` con la conexión Supabase y reiniciar `pnpm dev:api`. Conservar `.env.test` apuntando a la base local de pruebas. El paso de conexión no traslada registros locales existentes.

## Estado verificado del entorno de desarrollo

Se aplicaron en el proyecto indicado las migraciones `202609020001_create_accounts` y `202609020002_protect_accounts`. Se verificó RLS activo y ausencia de permisos SELECT de `anon` y `authenticated` sobre `accounts`.

El backend local utiliza ahora Supabase mediante sesión en el puerto 5432, TLS `verify-full` y el certificado CA del proyecto. La conexión local anterior se conservó en `apps/api/.env.local`; las pruebas siguen usando `apps/api/.env.test`. Estos archivos no se versionan. No se transfirieron registros locales a la nube.
