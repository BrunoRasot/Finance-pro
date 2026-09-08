# Temas de interfaz

Finance Pro ofrece Claro, Oscuro y Sistema en el encabezado de la aplicación y en las pantallas de autenticación.

- `src/app/theme.css` define los colores semánticos para ambos temas.
- `src/app/layout.tsx` lee la preferencia `finance-pro-theme` y la aplica en el HTML del servidor; no depende de un script de inicialización ni de un efecto después del primer pintado.
- `ThemeProvider` administra el selector. La cookie de apariencia dura un año, usa Path=/ y SameSite=Lax y añade Secure en HTTPS. Solo almacena light, dark o system; no contiene datos de autenticación.
- Sistema usa `prefers-color-scheme` mediante CSS, incluida la actualización cuando cambia la preferencia del dispositivo. Es el valor predeterminado si no hay una preferencia válida.
- La preferencia corresponde al navegador y al dominio; no se sincroniza entre dispositivos.

## Nuevas pantallas

Usar `AppShell` para pantallas autenticadas y `AuthLayout` para acceso y recuperación. El proveedor está en el layout raíz, por lo que sus descendientes heredan el tema.

Utilizar variables semánticas en lugar de colores fijos:

| Uso                                | Variable                                          |
| ---------------------------------- | ------------------------------------------------- |
| Fondo de página                    | `--cream`                                         |
| Panel, formulario o tabla          | `--surface`                                       |
| Fondo secundario o selección suave | `--surface-muted`                                 |
| Texto principal / secundario       | `--ink` / `--muted`                               |
| Enlace o indicador positivo        | `--green`                                         |
| Borde                              | `--line`                                          |
| Botón principal                    | `--action`, `--action-hover`, `--on-strong`       |
| Acento claro con texto oscuro      | `--accent`, `--on-accent`                         |
| Foco de teclado                    | `--focus`                                         |
| Error                              | `--danger-bg`, `--danger-text`, `--danger-border` |

Para añadir un token, definirlo en el tema claro y en las dos declaraciones oscuras (explícita y Sistema). Los fondos decorativos oscuros de marca conservan su propia combinación de texto claro. No usar filtros de inversión de color.

Revisar cada pantalla en claro, oscuro y móvil. Verificar contraste de textos, foco, estados de carga/error, controles nativos y ausencia de desbordamiento. Cambiar de tema no debe reiniciar formularios ni modificar datos financieros.

Las nuevas pantallas de trabajo deben ocupar el ancho disponible dentro de `AppShell`, alinear el contenido al inicio y aprovechar la altura visible. Evitar contenedores angostos centrados cuando la tarea principal se beneficia de columnas, tablas o paneles. Reservar los anchos limitados para formularios breves, lectura o autenticación. En resoluciones menores, convertir las columnas en una sola sin provocar desplazamiento horizontal.

Cada acción principal debe tener un único acceso visible por contexto. La navegación lateral o móvil concentra los cambios de sección; no repetir esos enlaces en el encabezado, el pie o tarjetas decorativas. Conservar enlaces contextuales solo cuando cambian el estado de la vista, regresan en una jerarquía o ayudan a recuperar un estado vacío.
