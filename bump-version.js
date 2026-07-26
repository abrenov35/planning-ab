const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, 'src', 'version.json');

try {
  let versionData = { version: 1 };
  
  if (fs.existsSync(versionFile)) {
    const content = fs.readFileSync(versionFile, 'utf8');
    versionData = JSON.parse(content);
  }
  
  versionData.version += 1;
  
  fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');
  console.log(`✅ Version bumped to v${versionData.version}`);
} catch (err) {
  console.error('❌ Error bumping version:', err.message);
  process.exit(1);
}
