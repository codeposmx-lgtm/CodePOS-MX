# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueños y encargados de negocios locales pequeños y medianos en México: talleres mecánicos, abarrotes, restaurantes, consultorios y comercios similares. Llegan buscando digitalizar su operación o su presencia sin complicarse: ordenar ventas e inventario, aparecer en internet o compartir sus datos de contacto de forma moderna. Ningún segmento tiene prioridad sobre los demás.

## Product Purpose

CodePOS MX ofrece sistemas de punto de venta (POS), páginas web, tarjetas digitales NFC y QR, menús digitales con QR y sistemas personalizados. El sitio presenta estas soluciones y lleva al visitante a iniciar una conversación. El éxito es que un dueño de negocio escriba por WhatsApp para platicar su necesidad.

## Positioning

Emprendimiento mexicano de tres jóvenes egresados universitarios. Un equipo pequeño que escucha la idea de cada negocio y propone una solución clara y a su medida, con tecnología accesible y sin complicaciones.

## Operating Context

- La conversación comercial se cierra por WhatsApp (número configurado en `WHATSAPP_NUMBER`, `src/App.jsx`). Correo (codeposmx@gmail.com), Instagram y Facebook son canales secundarios.
- Sitio público con cuatro entradas: portada (`/`), POS (`/pos.html`), NFC (`/nfc.html`) y legal (`/legal.html`). Se despliega en Vercel o Netlify.
- Existe un panel privado de analítica para Windows (`src/AnalyticsDashboard.jsx`, `desktop/`) que no forma parte del sitio público.

## Capabilities and Constraints

- React 18 + Vite 6, sin frameworks de CSS. Estilos en `src/styles.css`, `src/demo.css`, `src/motion.css`, `src/pos-page.css`, `src/legal.css`; la página NFC usa `nfc.css`.
- La portada incluye una demo interactiva del POS (`src/data/demoData.js`, `src/demo.css`).
- Aviso de cookies y páginas legales (privacidad, términos, cookies) ya implementados.
- Idioma: español de México.
- Sin precios publicados: no se deben mostrar.

## Brand Commitments

- Nombre: CodePOS MX, con "MX" destacado en el logotipo.
- Voz: cercana, en segunda persona ("tu negocio"), clara y sin tecnicismos.
- Misión: herramientas de punto de venta accesibles, eficientes y fáciles de usar para negocios locales y talleres. Visión: ser el aliado tecnológico de confianza de los pequeños y medianos comercios en México.
- Valores: innovación accesible, empatía comercial, transparencia y compromiso con el crecimiento.

## Evidence on Hand

- Fotografías e ilustraciones propias en `public/` (POS, inventario, ventas, sitios web, NFC/QR, menú digital, giros de negocio).
- Demo funcional del POS dentro del sitio.
- No hay todavía clientes publicables, testimonios ni precios. Ningún diseño debe inventar clientes, logos, testimonios, cifras ni precios.

## Product Principles

1. Cada página lleva a una conversación por WhatsApp.
2. Mostrar en vez de prometer: la demo y las imágenes reales del producto pesan más que los adjetivos.
3. Claridad sobre tecnicismos: un dueño de negocio sin experiencia técnica debe entender qué obtiene.
4. Honestidad: no afirmar resultados, clientes ni cifras que no existen.
