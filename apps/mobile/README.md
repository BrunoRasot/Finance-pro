# Finance Pro móvil

Aplicación Expo SDK 57 con React Native, Expo Router y TypeScript. Consume la misma API NestJS y usa Supabase únicamente para autenticar al usuario.

## Funciones incluidas

- Registro, inicio de sesión y recuperación de contraseña, con persistencia en el dispositivo.
- Resumen mensual separado en soles y dólares.
- Creación, edición, archivo y restauración de cuentas.
- Saldo, historial, registro, edición y eliminación de ingresos o gastos.
- Transferencias atómicas entre cuentas de la misma moneda.
- Presupuestos mensuales por moneda y categoría.
- Creación, edición, archivo y restauración de metas, con registro de aportes.
- Exportación privada de un respaldo JSON y movimientos CSV.
- Tema claro, oscuro o sincronizado con el sistema.
- Cierre de sesión y renovación automática de tokens.

## Configuración

Copiar `.env.example` como `.env.local`. Solo se admiten la URL y clave **publicable** de Supabase. Nunca colocar la contraseña PostgreSQL, `service_role` ni una clave `sb_secret_`.

Para recuperar contraseñas desde una compilación instalada, agregar
`financepro://reset-password` en **Supabase → Authentication → URL
Configuration → Redirect URLs**. Para probar el flujo desde Expo web, agregar
también la URL local usada por Expo, por ejemplo
`http://localhost:8081/reset-password`. Los despliegues públicos deben
registrar su propia URL HTTPS.

El correo puede usar el asunto **“Recupera tu acceso a Finance Pro”** y la
plantilla preparada en
[`docs/supabase-recovery-email.html`](../../docs/supabase-recovery-email.html).
Supabase solo habilita su edición después de configurar un proveedor SMTP
propio.

En un teléfono físico, `EXPO_PUBLIC_API_BASE_URL` debe utilizar la IP local de la computadora, por ejemplo `http://192.168.1.20:3001/api/v1`. El comando móvil abre temporalmente la API en la red local; todas las rutas financieras siguen exigiendo un JWT válido.

## Ejecución

1. Si la web no está ejecutándose, iniciar la API con `pnpm dev:api:mobile`. Si ya se ejecutó `pnpm dev`, reutilizar esa API y omitir este paso.
2. Ejecutar `pnpm dev:mobile` desde la raíz.
3. Instalar Expo Go en Android o iOS y escanear el código QR.

La computadora y el teléfono deben estar en la misma red. Nunca se deben ejecutar `pnpm dev` y `pnpm dev:api:mobile` al mismo tiempo: web y móvil comparten una sola instancia del backend. Si Windows solicita acceso de red para Node.js, permitir únicamente redes privadas. Para Android Emulator se puede usar `http://10.0.2.2:3001/api/v1`; para iOS Simulator, `http://127.0.0.1:3001/api/v1`.

## Validación

```bash
pnpm --filter @finance-pro/mobile typecheck
pnpm --filter @finance-pro/mobile lint
pnpm --filter @finance-pro/mobile build
pnpm --filter @finance-pro/mobile test
pnpm build:mobile
```

Las pruebas cubren centavos exactos, límites de contraseñas y reintentos. `build:mobile` genera paquetes JavaScript/Hermes para Android, iOS y web; no crea un APK/IPA ni acredita una prueba en dispositivo. `eas.json` prepara los perfiles `preview` (APK Android) y `production`, que requieren configurar la cuenta Expo, las variables públicas del servidor y la firma correspondiente. Ver [guía de lanzamiento](../../docs/release-v1.md).

Los movimientos, transferencias y aportes pendientes conservan su cuerpo y UUID para reintentar sin duplicarse. Confirmar el resultado antes de salir de la pantalla: este estado está en memoria y no sobrevive al cierre de la app. Si se cerró tras un error, revisar el historial antes de repetir la operación. Los importes se muestran sin convertirlos a `Number`. Las contraseñas nuevas tienen entre 12 y 128 caracteres.
