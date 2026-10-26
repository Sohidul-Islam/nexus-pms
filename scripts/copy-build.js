const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const src = path.join(rootDir, 'frontend', 'dist', 'frontend', 'browser');

const targets = [
  path.join(rootDir, 'browser'),
  path.join(rootDir, 'frontend', 'browser')
];

if (fs.existsSync(src)) {
  for (const target of targets) {
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(src, target, { recursive: true });
    console.log('[Build] Synced build output to: ' + target);
  }
} else {
  console.warn('[Build Warning] Source build directory not found: ' + src);
}
