// BotKeep & Cloud Hosting Smart Entrypoint with Auto-Build
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[ChzRoom] Initializing from directory:', __dirname);

const serverDist = path.resolve(__dirname, 'server/dist/index.js');
const clientDist = path.resolve(__dirname, 'client/dist/index.html');

function shouldBuild() {
  if (!fs.existsSync(serverDist) || !fs.existsSync(clientDist)) {
    return true;
  }
  try {
    const distTime = Math.min(fs.statSync(serverDist).mtimeMs, fs.statSync(clientDist).mtimeMs);
    const serverSrc = path.resolve(__dirname, 'server/src/index.ts');
    const clientSrc = path.resolve(__dirname, 'client/src/App.tsx');
    if (fs.existsSync(serverSrc) && fs.statSync(serverSrc).mtimeMs > distTime) return true;
    if (fs.existsSync(clientSrc) && fs.statSync(clientSrc).mtimeMs > distTime) return true;
  } catch (e) {
    // If error checking stats, default to false if dist exists
  }
  return false;
}

if (shouldBuild()) {
  console.log('[ChzRoom] Build artifacts missing or outdated. Running `npm run build`...');
  try {
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    console.log('[ChzRoom] Auto-build completed successfully.');
  } catch (err) {
    console.error('[ChzRoom] Auto-build encountered an error:', err.message || err);
  }
}

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
  console.error('[ChzRoom] FATAL: Could not find backend server bundle even after build attempt!');
  console.error('[ChzRoom] Current folder contents:', fs.readdirSync(__dirname));
  process.exit(1);
}

console.log('[ChzRoom] Successfully found backend bundle:', entryPath);
require(entryPath);
