# Publicación móvil 1.0.0

La aplicación usa el identificador `com.brunorasot.financepro` en Android e iOS.
La versión visible es `1.0.0`; EAS incrementa automáticamente los números internos
de producción.

## URLs públicas

- Política de privacidad: `https://finance-pro-web-o6ce.onrender.com/privacidad`
- Términos: `https://finance-pro-web-o6ce.onrender.com/terminos`
- Soporte: `https://finance-pro-web-o6ce.onrender.com/soporte`
- Eliminación de cuenta: `https://finance-pro-web-o6ce.onrender.com/eliminar-cuenta`

## Configuración de EAS

1. Iniciar sesión con `eas login` y asociar el proyecto con `eas init` desde
   `apps/mobile`.
2. Crear en los entornos `preview` y `production` estas variables:
   `EXPO_PUBLIC_API_BASE_URL=https://finance-pro-api-wyv2.onrender.com/api/v1`,
   `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
   `EXPO_PUBLIC_WEB_ORIGIN=https://finance-pro-web-o6ce.onrender.com`.
3. Crear un APK interno con `eas build --platform android --profile preview` e
   instalarlo en un teléfono. Completar el protocolo de aceptación de
   [release-v1.md](release-v1.md).
4. Crear los binarios de tienda con `eas build --platform android --profile production`
   y `eas build --platform ios --profile production`.

## Fichas de las tiendas

La descripción debe presentar Finance Pro como una herramienta para cuentas,
movimientos, transferencias, presupuestos y metas personales. No debe afirmar que
se conecta con bancos ni que ofrece asesoría financiera. Declarar que la app
recopila el correo para autenticación y los datos financieros introducidos por el
usuario para prestar el servicio. No contiene publicidad ni vende datos.

Antes de enviar, preparar capturas reales de teléfono, icono de tienda, gráfico
promocional de Google Play, clasificación por edades y respuestas de privacidad.
La cuenta de revisión debe usar datos ficticios. Verificar registro, recuperación,
exportación y eliminación en el binario firmado.

La publicación final requiere cuentas activas de Google Play Console y Apple
Developer, aceptar sus contratos y completar los formularios vigentes de cada
tienda.
