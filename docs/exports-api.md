# Exportación de datos

Las exportaciones se generan bajo demanda para el usuario autenticado. No se guardan en una ubicación pública y las respuestas incluyen `Cache-Control: no-store`.

## Respaldo JSON

`GET /exports/data.json` descarga `finance-pro-backup.json` con una versión de formato, fecha de generación y las cuentas, movimientos, transferencias, presupuestos, metas y aportes del propietario. Los importes se representan como cadenas decimales y las fechas usan ISO 8601 para evitar pérdidas de precisión o ambigüedad.

El archivo no incluye `ownerId`, claves de idempotencia, tokens ni credenciales. Los identificadores internos se conservan para mantener las relaciones entre registros.

## Movimientos CSV

`GET /exports/transactions.csv` descarga `finance-pro-movimientos.csv` codificado en UTF-8 con BOM. Incluye fecha, cuenta, moneda, tipo, categoría, importe, descripción e identificador de transferencia.

Cada celda se entrecomilla y duplica las comillas internas. Los valores que comienzan con `=`, `+`, `-` o `@` reciben un apóstrofo inicial para impedir que Excel u otra hoja de cálculo los interprete como fórmulas.

## Límites y seguridad

- Ambos endpoints requieren un JWT válido de Supabase.
- Todas las consultas filtran por el identificador verificado del usuario.
- Una exportación admite hasta 50 000 registros; al superar el límite responde `413`.
- La web expone `/descargas/json` y `/descargas/csv` como rutas autenticadas que transmiten el archivo sin exponer el token al navegador.
