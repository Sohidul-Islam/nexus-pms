const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const src = path.join(rootDir, 'frontend', 'dist', 'frontend', 'browser');

if (!fs.existsSync(src)) {
  console.warn('[Build Warning] Source build directory not found: ' + src);
  process.exit(0);
}

const targets = [
  // Root level targets (when Vercel Root Directory is './')
  path.join(rootDir, 'dist', 'frontend', 'browser'),
  path.join(rootDir, 'dist', 'browser'),
  path.join(rootDir, 'dist'),
  path.join(rootDir, 'browser'),

  // Frontend level targets (when Vercel Root Directory is 'frontend')
  path.join(rootDir, 'frontend', 'dist', 'browser'),
  path.join(rootDir, 'frontend', 'browser')
];

for (const target of targets) {
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(src, target, { recursive: true });
    console.log('[Build] Synced build output to: ' + target);
  } catch (err) {
    console.warn('[Build Warning] Could not sync to ' + target + ': ' + err.message);
  }
}
