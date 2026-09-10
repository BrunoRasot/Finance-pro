# FinancePro

Sistema de gestión financiera personal multiplataforma, desarrollado en TypeScript y organizado como un monorepo. Centraliza cuentas, movimientos, transferencias, presupuestos y metas de ahorro mediante una API compartida por los clientes web y móvil.

## Arquitectura del sistema

El backend implementa un **monolito modular con NestJS**, estructurado por dominios funcionales. Cada módulo separa presentación HTTP, casos de uso, reglas de dominio y persistencia. La inyección de dependencias conecta los servicios de aplicación con los repositorios mediante contratos explícitos.

La aplicación web utiliza **Next.js App Router**, con consultas financieras y acciones autenticadas ejecutadas desde el servidor. El cliente móvil utiliza **React Native y Expo**, consume la misma API y comparte las reglas de autorización y consistencia del backend. Ambos clientes acceden a los datos financieros a través de NestJS.

La persistencia se implementa con **PostgreSQL y Prisma ORM**, incluyendo migraciones versionadas, relaciones entre entidades, restricciones de integridad y transacciones de base de datos.

## Tecnologías utilizadas

| Capa                        | Tecnologías                                                       | Responsabilidad                                                                               |
| --------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lenguaje y runtime          | TypeScript, Node.js 24                                            | Tipado estático y ejecución del backend y del servidor web                                    |
| Frontend web                | Next.js 16, React 19, App Router                                  | Renderizado del servidor, navegación y acciones de gestión financiera                         |
| Aplicación móvil            | React Native, Expo, Expo Router                                   | Interfaz multiplataforma y navegación para Android e iOS                                      |
| Backend                     | NestJS 11, Express 5                                              | API HTTP, módulos de negocio e inyección de dependencias                                      |
| Persistencia                | PostgreSQL, Prisma 7, pg                                          | Modelo relacional, consultas, migraciones y operaciones transaccionales                       |
| Autenticación               | Supabase Auth, Supabase SSR, jose                                 | Gestión de sesiones, flujo PKCE y verificación de JWT                                         |
| Validación y seguridad HTTP | Zod, class-validator, class-transformer, Helmet, NestJS Throttler | Validación de entradas, transformación de DTO, cabeceras de seguridad y límites de peticiones |
| Infraestructura             | Render, Neon, Docker                                              | Alojamiento de web y API, PostgreSQL administrado y contenedores                              |
| Calidad de código           | ESLint, Prettier, Jest, Supertest, Node.js Test Runner            | Análisis estático, formato y pruebas automatizadas                                            |
| Gestión del repositorio     | pnpm workspaces, Git                                              | Administración del monorepo, dependencias y control de versiones                              |

## Módulos funcionales

- **Cuentas:** administración de efectivo, cuentas bancarias y billeteras en PEN o USD; archivado reversible y cálculo de saldos.
- **Movimientos:** ingresos y gastos categorizados, edición, eliminación e historial filtrable por fecha, tipo y categoría.
- **Transferencias:** operaciones entre cuentas de la misma moneda con registro atómico de los movimientos de origen y destino.
- **Reportes:** agregación mensual de ingresos y gastos, excluyendo transferencias internas para evitar su doble contabilización.
- **Presupuestos:** límites por usuario, mes, moneda y categoría, con cálculo de consumo, disponibilidad y porcentaje utilizado.
- **Metas de ahorro:** administración de objetivos y aportes, cálculo de progreso y conservación del historial mediante archivado.
- **Exportaciones:** generación de respaldos de datos en JSON versionado y archivos CSV de movimientos.

## Integridad y consistencia financiera

Los importes se almacenan con precisión decimal mediante `Decimal(18,2)` y se serializan como cadenas en los contratos JSON. El saldo se deriva del saldo inicial y de los movimientos registrados mediante agregaciones SQL; los filtros del historial no alteran su cálculo.

Las transferencias utilizan transacciones PostgreSQL y bloqueo de filas en un orden estable. El registro de la transferencia y sus dos movimientos se confirma como una única operación, evitando actualizaciones parciales.

Las claves de idempotencia permiten reintentar operaciones de creación sin duplicar registros. Las restricciones únicas por propietario y las claves foráneas compuestas refuerzan la integridad de los datos y la asociación de cada movimiento con la cuenta de su usuario.

Las operaciones conservan la moneda de cada cuenta. Las transferencias requieren monedas coincidentes y el sistema mantiene separados los importes en PEN y USD, sin conversión cambiaria automática.

## Autenticación y autorización

Supabase Auth administra la identidad y las sesiones. La API verifica JWT con firmas asimétricas ES256 o RS256 y obtiene la identidad del usuario desde el token validado. Los servicios y repositorios restringen el acceso a los recursos por propietario.

La web integra Supabase SSR mediante PKCE y cookies HttpOnly, con renovación de sesión y verificación del usuario en páginas privadas y acciones. El servidor Next.js transmite el JWT al backend para las consultas financieras. El cliente móvil mantiene su sesión mediante adaptadores de almacenamiento específicos de plataforma y envía el token a la misma API.

La capa HTTP incorpora validación de DTO, limitación de peticiones, cabeceras de seguridad, manejo centralizado de excepciones e identificadores de solicitud para trazabilidad.

## Organización del código

```text
finance-pro/
  apps/
    api/        # API NestJS y persistencia Prisma
    web/        # Cliente web Next.js
    mobile/     # Cliente React Native con Expo
  docs/         # Arquitectura y contratos funcionales
  scripts/      # Automatización y verificaciones
  deploy/       # Infraestructura y respaldos
```

Los módulos de negocio del backend se distribuyen en las capas `presentation`, `application`, `domain` e `infrastructure`. Los controladores gestionan el contrato HTTP, los servicios coordinan los casos de uso y los repositorios encapsulan el acceso a PostgreSQL.

## Calidad y operación

El repositorio incluye comprobación de tipos, análisis estático y pruebas unitarias, HTTP y de integración con PostgreSQL. Las pruebas cubren reglas financieras, aislamiento entre usuarios, idempotencia y comportamiento transaccional. La validación de versiones incluye compilaciones web y móvil y un simulacro de recuperación de datos.

La infraestructura documentada utiliza Render para la web y la API, Neon para PostgreSQL y Supabase para autenticación. Los endpoints de salud distinguen entre disponibilidad del proceso y preparación del servicio con conexión a la base de datos.

## Documentación técnica

- [Decisiones de arquitectura](docs/architecture.md)
- [Contrato de cuentas](docs/accounts-api.md)
- [Contrato de movimientos](docs/transactions-api.md)
- [Transferencias](docs/transfers-api.md)
- [Reportes](docs/reports-api.md)
- [Presupuestos](docs/budgets-api.md)
- [Metas de ahorro](docs/goals-api.md)
- [Exportaciones](docs/exports-api.md)
- [Registro de cambios](CHANGELOG.md)
