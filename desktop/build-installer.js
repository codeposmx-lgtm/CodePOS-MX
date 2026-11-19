'use strict';

// Genera el instalador en una carpeta temporal y copia el .exe a desktop/dist.
// En Documentos, Windows (antivirus / OneDrive) bloquea los archivos .asar mientras electron-builder
// los mueve (EBUSY/EPERM); fuera de esa carpeta el empaquetado funciona.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { version } = require('./package.json');

const dashboard = path.join(__dirname, '..', 'private-dashboard-build', 'index.html');
if (!fs.existsSync(dashboard)) {
  console.error('Falta private-dashboard-build. Ejecuta "npm run dashboard:package" desde la raíz del proyecto.');
  process.exit(1);
}

const out = path.join(os.tmpdir(), 'codepos-mx-dashboard-build');
fs.rmSync(out, { recursive: true, force: true });
const cli = path.join(__dirname, 'node_modules', 'electron-builder', 'cli.js');
const result = spawnSync(process.execPath, [cli, '--win', 'nsis', `-c.directories.output=${out}`], { cwd: __dirname, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);

const name = `CodePOS MX Dashboard Setup ${version}.exe`;
const dist = path.join(__dirname, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync(path.join(out, name), path.join(dist, name));
fs.rmSync(out, { recursive: true, force: true });
console.log(`\nInstalador listo: ${path.join(dist, name)}`);
