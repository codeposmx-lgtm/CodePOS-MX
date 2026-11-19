import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const dashboardRoot = resolve(projectRoot, 'private-dashboard');

export default defineConfig({
  root: dashboardRoot,
  base: './',
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: process.env.CODEPOS_PRIVATE_OUTDIR || resolve(projectRoot, 'private-dashboard-build'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(dashboardRoot, 'index.html'),
    },
  },
});
