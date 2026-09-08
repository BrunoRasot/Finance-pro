# Decisiones de arquitectura

## Monolito modular

Una API NestJS agrupa los módulos del negocio. Web y móvil consumirán la misma API. Los módulos se organizan por funcionalidad, evitando carpetas globales de controladores, servicios y repositorios que mezclen distintos negocios.

NestJS 11 se usa junto a las versiones compatibles de Config y Throttler. TypeScript 5.9 es compatible con el transformador de pruebas seleccionado. Las versiones resueltas están fijadas en `pnpm-lock.yaml`; actualizar dependencias exige ejecutar los controles de calidad. Se exige compatibilidad de dependencias pares y se revisan explícitamente los scripts de instalación.

## Estructura de un módulo de negocio

El módulo de cuentas está implementado con esta separación:

```text
modules/accounts/
  accounts.module.ts
  presentation/
    accounts.controller.ts
    dto/
  application/
    accounts.service.ts
    ports/
  domain/
  infrastructure/
    persistence/
```

- **Presentation:** recibe HTTP, valida DTO y traduce resultados. No ejecuta consultas ni cálculos financieros.
- **Application:** coordina casos de uso, autorización sobre recursos y límites de las transacciones. Define los contratos de persistencia que necesita.
- **Domain:** contiene reglas y tipos del negocio sin depender de NestJS, HTTP, Prisma o Supabase.
- **Infrastructure:** implementa esos contratos mediante Prisma o servicios externos.
- **El módulo Nest:** conecta implementaciones y contratos mediante inyección de dependencias.

El dominio no importa infraestructura. Los controladores no acceden a Prisma. Un módulo no importa archivos internos de otro módulo: consume servicios exportados o contratos explícitos. Crear capas cuando tengan una responsabilidad real; el endpoint de salud no necesita repositorio ni caso de uso vacío.

`common/` contiene comportamiento transversal de HTTP y seguridad. La conexión Prisma está en `src/infrastructure/database/`; los repositorios específicos permanecen dentro de cada módulo. `packages/` se usará cuando exista código que realmente compartan dos aplicaciones.

## Reglas financieras para la siguiente etapa

- Las cuentas usan `Decimal(18,2)` y montos como strings JSON. Se admiten PEN/USD, sin conversión ni agregación entre monedas. El saldo inicial no es todavía un saldo calculado a partir de movimientos.
- Guardar transferencias y sus dos efectos dentro de una transacción de base de datos.
- Derivar o reconciliar saldos a partir de movimientos y ajustes registrados.
- Incorporar claves de idempotencia cuando las operaciones puedan reintentarse.
- Derivar la identidad del token verificado; nunca confiar en un `userId` enviado por el cliente para establecer propiedad.
- Consultar y modificar recursos filtrando por propietario; probar el acceso entre dos usuarios.
- Mantener secretos y conexiones privilegiadas únicamente en el servidor.
- Usar restricciones de base de datos además de validaciones de aplicación.

## Alcance entregado

Arranque, políticas HTTP, salud, PostgreSQL 17 local, Prisma 7.10, migraciones y autenticación JWT asimétrica. Las cuentas permiten crear, editar, listar por estado, archivar, restaurar y consultar por identificador. El archivado es reversible y conserva movimientos; la moneda permanece inmutable durante la edición. El usuario proviene del token Supabase verificado y no se duplica una tabla de credenciales local.

El módulo `transactions` sigue las capas de cuentas y añade ingresos/gastos, categorías predefinidas, edición, eliminación y filtros por fecha, tipo y categoría. Una clave única por usuario garantiza idempotencia y una clave foránea compuesta enlaza cada movimiento con la cuenta de su propietario. El saldo se agrega en SQL con precisión decimal dentro de una sola instantánea; se permiten saldos negativos. Las cuentas archivadas bloquean actividad nueva sin eliminar su historial. La web consume este contrato desde el servidor Next.js. Mantiene las claves de idempotencia durante reintentos y separa los filtros de historial del cálculo de saldo.

El módulo `transfers` coordina transferencias entre cuentas activas de la misma moneda. Bloquea ambas filas de cuenta en un orden estable y crea el registro principal junto con sus dos movimientos dentro de una transacción PostgreSQL. La clave de idempotencia pertenece a la transferencia; los movimientos enlazados usan claves internas. La categoría `TRANSFER` queda reservada al sistema y los reportes la excluyen para evitar contabilizar movimientos internos como ingresos o gastos. La programación y las categorías personalizadas siguen pendientes.

El módulo `budgets` conserva un límite único por propietario, mes, moneda y categoría de gasto. La consulta calcula el consumo desde los movimientos registrados, incluyendo el historial de cuentas archivadas y excluyendo transferencias. El cliente recibe valores decimales normalizados, importe disponible y porcentaje utilizado; la autorización nunca depende de un propietario enviado por el navegador.

El módulo `goals` separa la definición de una meta de sus aportes. El total ahorrado y el progreso se calculan desde `goal_contributions`; la moneda queda fija y cada aporte usa una clave de idempotencia única por propietario. Archivar conserva el historial y bloquea nuevos aportes hasta restaurar la meta.

La web Next.js usa Supabase SSR con PKCE y cookies HttpOnly. Proxy renueva la sesión; las páginas privadas y las acciones verifican al usuario mediante `getUser`. Las peticiones financieras salen del servidor Next.js hacia NestJS con el JWT, sin exponer tokens al código del navegador. NestJS conserva la autorización por propietario. El callback restringe destinos a cuentas o actualización de contraseña. Los valores monetarios se mantienen como cadenas y se formatean con BigInt para preservar centavos.

Prisma genera código CommonJS para mantener el backend actual. `jose` se carga mediante importación dinámica ESM. Jest utiliza módulos VM para probar ese mismo flujo. No hay rutas ni claves de prueba en producción.

`pnpm-workspace.yaml` fija temporalmente `@prisma/config > deepmerge-ts` en 8.0.0 y `prisma > mysql2` en 3.23.1 para corregir los avisos GHSA-ggr8-5vv4-36mx, GHSA-3f6p-5ww8-9rcr y GHSA-rgwj-5xj2-c3m3. La generación, migración, compilación y pruebas de PostgreSQL se verificaron con esas versiones. Revisar estas excepciones al actualizar Prisma.

## Exportación

El módulo `exports` consulta directamente los agregados financieros del propietario porque su función es construir una proyección de lectura transversal. Expone un respaldo JSON versionado y un CSV de movimientos. La web transmite ambos archivos mediante rutas autenticadas del servidor para mantener el JWT fuera del cliente.

## Cliente móvil

La candidata corrige los avisos de `uuid` y `decode-uri-component` con overrides limitados a `xcode` y `query-string`. `patches/query-string@7.1.3.patch` adapta la importación CommonJS al decodificador ESM 0.5.0, manteniendo la API de Expo Router. Las pruebas comprueban esta interoperabilidad. Revisar y retirar estas excepciones cuando los paquetes superiores incorporen las correcciones.

`apps/mobile` es una aplicación Expo y React Native independiente de Next.js. Expo Router organiza las rutas y Supabase conserva la sesión en el almacenamiento local de Expo. El móvil no consulta PostgreSQL directamente: envía el JWT a la misma API NestJS, que vuelve a verificar identidad, propiedad, validaciones e idempotencia. Android, iOS y web usan adaptadores de sesión separados para no empaquetar SQLite en el navegador.

## Referencias

- [Módulos de NestJS](https://docs.nestjs.com/modules)
- [Validación](https://docs.nestjs.com/techniques/validation)
- [Configuración](https://docs.nestjs.com/techniques/configuration)
- [Helmet](https://docs.nestjs.com/security/helmet)
- [Límites de peticiones](https://docs.nestjs.com/security/rate-limiting)
