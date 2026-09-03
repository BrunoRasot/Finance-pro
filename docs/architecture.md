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

Arranque, políticas HTTP, salud, PostgreSQL 17 local, Prisma 7.10, migración de cuentas y autenticación JWT asimétrica. Las cuentas permiten crear, listar con paginación y consultar por identificador. El usuario proviene del token Supabase verificado y no se duplica una tabla de credenciales local. No hay todavía movimientos, edición, borrado, cálculos de saldo ni interfaz de acceso.

Prisma genera código CommonJS para mantener el backend actual. `jose` se carga mediante importación dinámica ESM. Jest utiliza módulos VM para probar ese mismo flujo. No hay rutas ni claves de prueba en producción.

`pnpm-workspace.yaml` fija temporalmente `@prisma/config > deepmerge-ts` en 8.0.0 y `prisma > mysql2` en 3.23.1 para corregir los avisos GHSA-ggr8-5vv4-36mx, GHSA-3f6p-5ww8-9rcr y GHSA-rgwj-5xj2-c3m3. La generación, migración, compilación y pruebas de PostgreSQL se verificaron con esas versiones. Revisar estas excepciones al actualizar Prisma.

## Referencias

- [Módulos de NestJS](https://docs.nestjs.com/modules)
- [Validación](https://docs.nestjs.com/techniques/validation)
- [Configuración](https://docs.nestjs.com/techniques/configuration)
- [Helmet](https://docs.nestjs.com/security/helmet)
- [Límites de peticiones](https://docs.nestjs.com/security/rate-limiting)
