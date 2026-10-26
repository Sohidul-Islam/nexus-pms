const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Target file path required');
  process.exit(1);
}

let content = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { content += chunk; });
process.stdin.on('end', () => {
  const fullPath = path.resolve(targetPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Successfully wrote to: ' + targetPath);
});
