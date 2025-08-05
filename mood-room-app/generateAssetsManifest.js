// Node.js script to get assets from public folder and create a assetsmanifest.json file
// this also makes sure when new assets added to folder the manifest is updated automatically
//
const fs = require('fs');
const path = require('path');

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

// Function to get thumbnail path
function getThumbnailPath(modelPath) {
  const thumbnailPath = modelPath.replace(/\.glb$/, '.png').replace('/assets/', '/assets/Thumbnails/'); // e.g /assets/Thumbnails/Categories/bed.png
  if (fileExists(path.join(__dirname, 'public', thumbnailPath))) {
    return thumbnailPath; // return thumbnail path if it exists
  }
  
  // If no thumbnail exists, return a placeholder path
  return '/placeholder-thumbnail.jpg';
}

// Function to walk through directory and generate manifest
function walkDir(dir, baseUrl) {
  const items = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(assetsRoot, fullPath).replace(/\\/g, '/'); // keeps relative path e.g Categories/bed.glb
    
    if (fs.statSync(fullPath).isDirectory()) {
      items.push(...walkDir(fullPath, baseUrl + '/' + file));
    } else if (file.endsWith('.glb')) {
      const modelPath = '/assets/' + relPath; // e.g /assets/Categories/bed.glb
      const thumbnailPath = getThumbnailPath(modelPath); // e.g /assets/Thumbnails/Categories/Furniture/bed.png
      
      const folderName = path.dirname(relPath).split(path.sep)[0];
      items.push({
        name: path.basename(file, '.glb'),
        category: ['All', folderName || 'Uncategorized'],
        path: modelPath,
        thumbnail: thumbnailPath
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

// Generate manifest
const manifest = walkDir(assetsRoot, '');
fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2));
console.log('assetsManifest.json generated with', manifest.length, 'items.');
