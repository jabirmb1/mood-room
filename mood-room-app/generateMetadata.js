// generateMetadata.js
const fs = require('fs');
const path = require('path');

const assetsRoot = path.join(__dirname, 'public', 'assets');

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Generate metadata for one object
function createMetadata(objName, dir) {
  const metaPath = path.join(dir, objName + 'Meta.json');
  if (!fileExists(metaPath)) {
    const blankMeta = {
      name: objName,
      roomType: "",
      dimensions: {
        width: 0,
        height: 0,
        depth: 0
      },
      priority: 1,
      mood: {},
      rules: {}
    };
    fs.writeFileSync(metaPath, JSON.stringify(blankMeta, null, 2));
    console.log('Created metadata for', objName);
  }
}

// Walk assets folder and generate metadata
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.glb') || file.endsWith('.gltf')) {
      const objName = path.basename(file, path.extname(file));
      createMetadata(objName, path.dirname(fullPath));
    }
  }
}

walkDir(assetsRoot);
console.log('Metadata generation done.');
