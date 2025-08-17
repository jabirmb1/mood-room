// Node.js script to get assets from public folder and create a assetsmanifest.json file
// this also makes sure when new assets added to folder the manifest is updated automatically
//
const fs = require('fs');
const path = require('path');
const validCategories = ['Furniture', 'Lights', 'Decor', 'WallArt']; // valid categories for models

const assetsRoot = path.join(__dirname, 'public', 'assets');   // path to assets folder
const outputManifest = path.join(__dirname, 'public', 'assetsManifest.json'); // path to output manifest file

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// function to get thumbnail path for a model, or replace it with a placeholder if it is not found.
function findThumbnail(fullDirPath, modelName) {
  // Look for png/jpg/jpeg in same folder as model
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  for (const ext of exts) {
    const thumbPath = path.join(fullDirPath, modelName + ext);
    if (fileExists(thumbPath)) {
      return '/assets/' + path.relative(assetsRoot, thumbPath).replace(/\\/g, '/');
    }
  }
  return '/placeholder-thumbnail.jpg';
}

// function to find a model's metadata file.
function findMeta(fullDirPath, modelName) {
  const metaPath = path.join(fullDirPath, modelName + 'Meta.json');
  if (fileExists(metaPath)) {
    return '/assets/' + path.relative(assetsRoot, metaPath).replace(/\\/g, '/');
  }
  return null;
}

// Function to walk through directory and generate manifest
function walkDir(dir, baseUrl) {
  const items = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      items.push(...walkDir(fullPath));
    } else if (file.endsWith('.glb') || file.endsWith('.gltf')) {
      const modelName = path.basename(file, path.extname(file));
      const relPath = path.relative(assetsRoot, fullPath).replace(/\\/g, '/'); // keeps relative path e.g Categories/bed/bed.glb
      const modelPath = '/assets/' + relPath;

      const thumbnailPath = findThumbnail(path.dirname(fullPath), modelName);
      const metaPath = findMeta(path.dirname(fullPath), modelName);

      // Get top-level category folder (first folder inside assets)
      const parts = relPath.split('/');
      const topCategory = parts[0]; // e.g. 'Furniture', 'Lights', 'Decor', 'WallArt'

      // Enforce clean category naming
      const categoryName = validCategories.includes(topCategory)? topCategory : 'Uncategorized';

      items.push({
        name: modelName,
        category: categoryName.toLowerCase(),
        path: modelPath,
        thumbnail: thumbnailPath,
        meta: metaPath
      });
    }
  }

  return items;
}

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsRoot)) {
  fs.mkdirSync(assetsRoot, { recursive: true });
}

// Create placeholder image if it doesn't exist
const placeholderPath = path.join(__dirname, 'public', 'placeholder-thumbnail.jpg');
if (!fileExists(placeholderPath)) {
  console.warn('Placeholder thumbnail missing:', placeholderPath);
}


// Generate manifest
const manifest = walkDir(assetsRoot, '');
fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2));
console.log('assetsManifest.json generated with', manifest.length, 'items.');
