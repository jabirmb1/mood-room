// Node.js script to get assets from public folder and create a assetsmanifest.json file
// this also makes sure when new assets added to folder the manifest is updated automatically
//
// generateAssetsManifest.js
const fs = require('fs');
const path = require('path');

const validCategories = ['Furniture', 'Lights', 'Decor', 'WallArt']; // allowed categories
const assetsRoot = path.join(__dirname, 'public', 'assets'); 
const outputManifest = path.join(__dirname, 'public', 'assetsManifest.json');

// helper to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// helper to find thumbnail
function findThumbnail(modelName) {
  const thumbDir = path.join(__dirname, 'public', 'thumbnail');
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  
  for (const ext of exts) {
    const thumbPath = path.join(thumbDir, modelName + ext);
    if (fs.existsSync(thumbPath)) {
      return '/thumbnail/' + modelName + ext; // public path
    }
  }

  return '/placeholder-thumbnail.jpg';
}

// helper to find metadata in same folder
function findMeta(fullDirPath, modelName) {
  const metaPath = path.join(fullDirPath, modelName + 'Meta.json');
  if (fileExists(metaPath)) {
    return '/assets/' + path.relative(assetsRoot, metaPath).replace(/\\/g, '/');
  }
  return '/assets/' + path.relative(assetsRoot, path.join(fullDirPath, modelName + 'Meta.json')).replace(/\\/g, '/');
}

// walk directory recursively
function walkDir(dir) {
  const items = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      items.push(...walkDir(fullPath));
    } else if (file.endsWith('.glb') || file.endsWith('.gltf')) {
      const modelName = path.basename(file, path.extname(file));
      const relPath = '/assets/' + path.relative(assetsRoot, fullPath).replace(/\\/g, '/');

      const thumbnailPath = findThumbnail(path.dirname(fullPath), modelName);
      const metaPath = findMeta(path.dirname(fullPath), modelName);

      // top-level folder for category
      const parts = path.relative(assetsRoot, fullPath).split(path.sep);
      const topCategory = parts[0];
      const categoryName = validCategories.includes(topCategory) ? topCategory : 'Uncategorized';

      items.push({
        name: modelName,
        category: categoryName.toLowerCase(),
        path: relPath,
        thumbnail: thumbnailPath,
        meta: metaPath
      });
    }
  }

  return items;
}

// ensure assets folder exists
if (!fs.existsSync(assetsRoot)) fs.mkdirSync(assetsRoot, { recursive: true });

// generate manifest
const manifest = walkDir(assetsRoot);

// write manifest
fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2));
console.log('assetsManifest.json generated with', manifest.length, 'items.');
