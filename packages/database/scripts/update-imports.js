const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '../server'),
  path.join(__dirname, '../tests'),
  path.join(__dirname, '../tests-e2e'),
  path.join(__dirname, '../scripts')
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace '../../lib/' with '../../src/lib/'
      const pattern2 = /([\'\"])\.\.\/\.\.\/lib\//g;
      if (pattern2.test(content)) {
        content = content.replace(pattern2, '$1../../src/lib/');
        changed = true;
      }

      // Replace '../lib/' with '../src/lib/'
      const pattern1 = /([\'\"])\.\.\/lib\//g;
      if (pattern1.test(content)) {
        content = content.replace(pattern1, '$1../src/lib/');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in: ${fullPath}`);
      }
    }
  });
}

targetDirs.forEach(dir => processDir(dir));
console.log('Import paths update completed.');
