const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'src', 'version.json');
const publicFile = path.join(__dirname, 'public', 'version.json');

try {
  let versionData = { version: 1 };
  
  // Lire depuis src (source unique)
  if (fs.existsSync(srcFile)) {
    const content = fs.readFileSync(srcFile, 'utf8');
    versionData = JSON.parse(content);
  }
  
  versionData.version += 1;
  
  // Écrire dans LES DEUX fichiers
  fs.writeFileSync(srcFile, JSON.stringify(versionData, null, 2) + '\n');
  fs.writeFileSync(publicFile, JSON.stringify(versionData, null, 2) + '\n');
  
  console.log(`✅ Version bumped to v${versionData.version}`);
} catch (err) {
  console.error('❌ Error bumping version:', err.message);
  process.exit(1);
}
