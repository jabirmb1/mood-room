// Node.js script to get assets from public folder and create a manifest.json file
// this also makes sure when new assets added to folder the manifest is updated automatically
const fs = require('fs');
const path = require('path');

const assetsRoot = path.join(__dirname, 'public', 'assets');
const outputManifest = path.join(__dirname, 'public', 'assetsManifest.json');

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
  const thumbnailPath = modelPath.replace(/\.glb$/, '.png').replace('/assets/', '/assets/Thumbnails/');
  if (fileExists(path.join(__dirname, 'public', thumbnailPath))) {
    return thumbnailPath;
  }
  
  // If no thumbnail exists, return a placeholder path
  return '/placeholder-thumbnail.jpg';
}

function walkDir(dir, baseUrl) {
  const items = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(assetsRoot, fullPath).replace(/\\/g, '/');
    
    if (fs.statSync(fullPath).isDirectory()) {
      items.push(...walkDir(fullPath, baseUrl + '/' + file));
    } else if (file.endsWith('.glb')) {
      const modelPath = '/assets/' + relPath;
      const thumbnailPath = getThumbnailPath(modelPath);
      
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


const manifest = walkDir(assetsRoot, '');
fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2));
console.log('assetsManifest.json generated with', manifest.length, 'items.');
