CodePOS MX — Sitio web (React + Vite)

Requisitos: Node.js 18 o superior.

Desarrollo local:
1. Ejecuta `npm install`.
2. Ejecuta `npm run dev`.
3. Abre la URL que muestra Vite. La portada está en `/` y la página NFC en `/nfc.html`.

Compilar para producción:
- `npm run build` genera el sitio estático en `dist/`.
- `npm run preview` permite revisar localmente la compilación.

Despliegue:
- Vercel: importa el proyecto y usa `npm run build` como comando de compilación y `dist` como directorio de salida.
- Netlify: importa el proyecto; `netlify.toml` configura el comando y directorio de salida.
- Ambos servicios administran el certificado SSL/HTTPS del dominio. `vercel.json` y `netlify.toml` agregan encabezados básicos de seguridad.

La portada, la página NFC (`/nfc.html`) y la página POS (`/pos.html`) son entradas independientes de React/Vite. Tipografía: San Francisco en Mac/iPhone/iPad e Inter (incluida en src/fonts) en los demás dispositivos; ver src/fonts.css.
