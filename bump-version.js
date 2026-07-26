const fs = require('fs');
const path = require('path');

const versionJsFile = path.join(__dirname, 'src', 'version.js');
const versionJsonFile = path.join(__dirname, 'src', 'version.json');

try {
  let versionNumber = 1;
  
  // Lire depuis version.json (source de vérité)
  if (fs.existsSync(versionJsonFile)) {
    const content = fs.readFileSync(versionJsonFile, 'utf8');
    const versionData = JSON.parse(content);
    versionNumber = versionData.version;
  }
  
  versionNumber += 1;
  
  // Écrire dans src/version.json (source de vérité)
  fs.writeFileSync(versionJsonFile, JSON.stringify({ version: versionNumber }, null, 2) + '\n');
  
  // Écrire dans src/version.js (ce qui sera bundlé)
  const jsContent = `export const VERSION = ${versionNumber};\n`;
  fs.writeFileSync(versionJsFile, jsContent);
  
  console.log(`✅ Version bumped to v${versionNumber}`);
} catch (err) {
  console.error('❌ Error bumping version:', err.message);
  process.exit(1);
}
