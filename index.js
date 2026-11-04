// BotKeep & Cloud Hosting Production Entrypoint
const fs = require('fs');
const path = require('path');

console.log('[ChzRoom] Initializing from directory:', __dirname);

const candidates = [
  './server/dist/index.js',
  './dist/index.js',
  './server/index.js',
];

let entryPath = null;
for (const rel of candidates) {
  const full = path.resolve(__dirname, rel);
  if (fs.existsSync(full)) {
    entryPath = full;
    break;
  }
}

if (!entryPath) {
  console.error('[ChzRoom] FATAL: Could not find backend server bundle!');
  console.error('[ChzRoom] Current folder contents:', fs.readdirSync(__dirname));
  process.exit(1);
}

console.log('[ChzRoom] Loading server bundle from:', entryPath);
require(entryPath);
