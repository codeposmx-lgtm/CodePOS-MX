import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        nfc: resolve(projectRoot, 'nfc.html'),
        pos: resolve(projectRoot, 'pos.html'),
        legal: resolve(projectRoot, 'legal.html'),
      },
    },
  },
});
