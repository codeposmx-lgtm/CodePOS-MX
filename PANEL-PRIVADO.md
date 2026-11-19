# Panel privado de analítica · CodePOS MX

App local para Windows (**CodePOS MX Dashboard**). No forma parte del sitio público:
`npm run build` solo compila `index.html`, `nfc.html`, `pos.html` y `legal.html`. Además,
`.vercelignore` excluye el panel, la app de escritorio (`desktop/`) y este documento.

## Instalar, abrir y reconstruir

- **Generar el instalador:** desde la raíz del proyecto, `npm run dashboard:package`. El resultado queda en
  `desktop\dist\CodePOS MX Dashboard Setup 2.0.0.exe`.
- **Instalar:** ejecuta el `.exe`. No requiere permisos de administrador y crea accesos directos en el menú Inicio y en el escritorio.
  La app no está firmada, así que Windows SmartScreen puede mostrar «Windows protegió su PC». Elige
  **Más información › Ejecutar de todas formas**.
- **Abrir sin instalar (desarrollo):** `npm run dashboard:dev`.
- **Pruebas de la app:** `npm --prefix desktop test`.
- **Primera vez en un equipo nuevo:** `npm install` y `npm --prefix desktop install`. La segunda descarga Electron.
- El instalador se arma en una carpeta temporal y luego se copia a `desktop\dist`. Así se evita que Windows bloquee
  archivos dentro de Documentos durante el empaquetado.

## Arquitectura y seguridad

- **Panel (React, `src/AnalyticsDashboard.jsx`)**: no tiene acceso a la red (CSP `connect-src 'none'`).
  Pide datos a la app con `window.codepos.call(acción, datos)` y solo recibe cifras agregadas.
  No contiene datos de ejemplo: mientras no haya una conexión verificada, muestra «—».
- **Capa nativa (Electron/Node, `desktop/`)**: OAuth, llamadas a las API y almacenamiento cifrado.
  - `main.js`: ventana del panel (aislada, sandbox, sin Node, sesión en memoria). El puente solo acepta mensajes del
    documento principal empaquetado, y la navegación queda limitada a los archivos del panel. No abre ventanas nuevas.
  - `preload.js`: expone únicamente `window.codepos.call`.
  - `lib/store.js`: secretos cifrados con el cifrado de Windows (DPAPI, ligado a tu usuario de Windows) en
    `%APPDATA%\CodePOS MX Dashboard\secrets.json`. Los ajustes no secretos (página de Facebook elegida, ID de propiedad GA4)
    van en `settings.json`. Si el cifrado no está disponible, no se guarda nada.
  - `lib/prompt.js` y `prompt/`: ventana propia para escribir credenciales. Lo que escribes va a la capa nativa, nunca al panel.
  - `lib/meta.js` y `lib/meta-login.js`: Facebook Login para escritorio (redirección a `login_success.html` en una ventana
    aislada, sin cookies persistentes y con verificación de `state`). Los tokens van en la cabecera `Authorization`, nunca en la URL.
    Si el App Secret está guardado, cambia el token por uno de ~60 días y firma las consultas con `appsecret_proof`.
  - `lib/google.js`: OAuth de app instalada con PKCE, navegador del sistema y retorno a `127.0.0.1` (puerto aleatorio).
    Permiso `analytics.readonly`.
- El puente nunca devuelve tokens ni secretos. «Desconectar» borra el token y revoca el acceso en Meta o Google.
- Desinstalar la app no borra `%APPDATA%\CodePOS MX Dashboard`. Para quitar también las credenciales guardadas, borra esa carpeta.

## Meta: permisos (solo lectura)

App **CodePOS MX Analytics**, ID `4913773975558748`, Graph API `v26.0`. La app solicita **solo** estos permisos al iniciar sesión:

| Permiso | Para qué | ¿Puede escribir? |
|---|---|---|
| `pages_show_list` | Listar las páginas que administras | No |
| `pages_read_engagement` | Leer datos, publicaciones y seguidores de la página; obtener el token de página | No |
| `read_insights` | Leer las estadísticas de la página | No |
| `instagram_basic` | Leer el perfil y las publicaciones de la cuenta profesional vinculada | No |
| `instagram_manage_insights` | Leer las estadísticas de Instagram (pese a «manage», solo es lectura) | No |

No se solicitan: `pages_manage_posts`, `pages_manage_engagement`, `pages_manage_metadata`, `pages_messaging`,
`instagram_content_publish`, `instagram_manage_messages`, `instagram_manage_comments`, `ads_management`, `ads_read`.
Aunque un caso de uso de Meta los incluya en su lista, no se conceden si la app no los pide al iniciar sesión.
Después de conectar, el panel compara los permisos concedidos con esta lista y avisa de cualquier extra.

**Posible excepción:** si la página CodePOS MX está dentro de un portfolio comercial y tu acceso proviene de él,
Meta puede exigir `business_management`, que también permite administrar activos del portfolio. **No se ha añadido.**
Solo debería considerarse si `me/accounts` no devuelve la página, y antes habría que confirmarlo.

Métricas consultadas (vigentes tras la retirada de `page_impressions*` en nov. 2025 y jun. 2026):
- Facebook: `page_total_media_view_unique`, `page_media_view`, `page_post_engagements`, `page_daily_follows_unique`,
  `followers_count`, publicaciones recientes con reacciones, comentarios, compartidos y `post_total_media_view_unique`.
- Instagram: `reach` (diario), `views`, `total_interactions`, `profile_views`, `accounts_engaged`, `follows_and_unfollows`,
  `followers_count` y publicaciones recientes con `reach`. Instagram limita cada consulta a 30 días y guarda 90.
  Algunas métricas requieren al menos 100 seguidores.
- Cada métrica se pide por separado: si Meta retira una, solo esa aparece como aviso y las demás siguen funcionando.

## Configuración en Meta Developers

1. **Ya configurado** en CodePOS MX Analytics (app ID `4913773975558748`): `pages_show_list`, `pages_read_engagement`,
   `read_insights`, `instagram_basic` e `instagram_manage_insights` aparecen como **Listo para la prueba**. La configuración
   de Facebook Login para empresas «CodePOS Dashboard - Solo lectu» tiene el ID `29617578057845720` y pide exactamente esos cinco scopes.
   En esa configuración se eligió **Token de acceso de usuario**. No agregues `business_management` ni permisos de publicación o mensajes.
2. **Ya configurado** en Configuración de la app › Avanzada: «¿App nativa o para computadora?» está activado y la URL de
   devolución es `https://www.facebook.com/connect/login_success.html`. Estos valores no dependen del sistema operativo:
   sirven igual para la app de Windows.
3. No hace falta publicar la app ni pasar App Review: en modo de desarrollo los administradores de la app pueden conceder estos permisos
   sobre sus propias cuentas. Solo funciona para personas con un rol en la app.
4. Instagram @codeposmx debe ser una cuenta **profesional** (Empresa o Creador) **vinculada a la página CodePOS MX**.
5. Opcional, recomendado: en la app › Conexiones › «App Secret → Windows». Así obtienes un token de ~60 días
   en lugar de uno de 1–2 horas. Cópialo de Configuración de la app › Básica directamente a la ventana de la app, nunca a un chat.
6. Opcional: en Configuración avanzada activa «Requerir secreto de la app»; la app ya envía `appsecret_proof` si tiene el secreto.

## Pendiente en Google Analytics 4

1. **Decisión necesaria**: el sitio no tiene GA4 instalado y el aviso de cookies afirma «No usamos cookies de analítica».
   Instalar GA4 requiere cambiar ese aviso y la página legal y, de preferencia, pedir consentimiento antes de cargar la etiqueta.
   No se ha hecho.
2. Crear la propiedad GA4 y el flujo web para `codeposmx.vercel.app`.
3. Google Cloud: habilitar *Google Analytics Data API* y crear un ID de cliente OAuth de tipo **App de escritorio**.
   Si dejas la pantalla de consentimiento en modo «Prueba», Google invalida la autorización cada 7 días y habrá que reconectar.
4. En la app › Sitio web › «Configurar credenciales»: ID de cliente, secreto e ID numérico de la propiedad. Después, «Conectar con Google».

## Estado de verificación (2026-11-18)

- **Verificado en Windows:**
  - 65 pruebas automáticas (`npm --prefix desktop test`).
  - El sitio público compila igual que antes (mismos 37 archivos en `dist/`, sin rastro del panel).
  - La app arranca y el panel carga.
  - El puente responde y rechaza acciones desconocidas.
  - El panel no puede conectarse a internet.
  - La ventana de credenciales valida, guarda cifrado y no deja texto plano en disco.
  - La ventana de Meta abre la página oficial de inicio de sesión de Facebook, y cerrarla cancela el flujo.
  - El instalador instala, crea accesos directos, abre la app y se desinstala.
  - No hay tokens ni secretos en el código empaquetado.
- **No verificado**: inicio de sesión real en Meta y Google, permisos concedidos y métricas reales.
  Hasta que el panel muestre «Datos reales verificados», **no hay conexión real**.
