# API de cuentas

Base: `http://127.0.0.1:3001/api/v1`.

## Autenticación

Enviar `Authorization: Bearer <access_token>` con un token de usuario emitido por el proyecto Supabase configurado. No enviar la clave anónima, publishable key, service role ni refresh token en lugar del access token.

La API valida firma ES256/RS256, emisor, audiencia, expiración y usuario. Las claves se consultan en `SUPABASE_URL/auth/v1/.well-known/jwks.json`. La integración real no requiere clave privada ni contraseña Supabase. Aún no existe una pantalla para registrar usuarios o iniciar sesión.

## Crear cuenta

`POST /accounts`, con `Content-Type: application/json`:

```json
{
  "name": "Cuenta principal",
  "type": "BANK",
  "currency": "PEN",
  "openingBalance": "1500.25"
}
```

- Nombre de 1 a 80 caracteres, después de quitar espacios iniciales/finales.
- Tipo: `CASH`, `BANK` o `WALLET`.
- Moneda: `PEN` o `USD`. No se realizan conversiones entre monedas.
- Monto inicial: string decimal no negativo, máximo 16 dígitos enteros y 2 decimales. No enviar números JSON ni notación científica.
- No enviar `ownerId`, `userId`, `id` ni campos adicionales.

Respuesta 201: `id`, `name`, `type`, `currency`, `openingBalance` (siempre con dos decimales) y `createdAt` (UTC). La propiedad se deriva del JWT. Los nombres no son únicos y reintentar un POST exitoso crea otra cuenta; todavía no hay idempotencia para esta operación.

`openingBalance` es un monto inicial registrado. No es un saldo actualizado: el módulo de movimientos vendrá después. Esta etapa no admite cuentas de deuda ni saldos iniciales negativos.

## Listar

`GET /accounts?limit=20&offset=0`

Devuelve `items`, `limit` y `offset`. Solo incluye cuentas propias, ordenadas por creación e identificador descendentes. `limit`: 1–100. `offset`: 0–10000. No se devuelve un total ni se permite filtrar por otro propietario.

## Consultar una cuenta

`GET /accounts/<uuid>` devuelve la cuenta propia. Una cuenta ajena y una inexistente producen el mismo 404.

## Respuestas de error

| Código    | Significado                                                       |
| --------- | ----------------------------------------------------------------- |
| 400       | Datos, paginación o identificador inválidos                       |
| 401       | Token ausente, inválido, expirado o autenticación sin configurar  |
| 404       | Cuenta no accesible para ese usuario                              |
| 429       | Límite de peticiones excedido                                     |
| 500 / 503 | Fallo interno o dependencia no disponible, sin detalles sensibles |

No hay rutas para editar, eliminar ni transferir fondos todavía.
