// generateThumbnail.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const assetsRoot = path.join(__dirname, 'public', 'assets');
const thumbnailsRoot = path.join(assetsRoot, 'Thumbnails');

async function generateThumbnail(browser, modelPath, thumbnailPath) {
  const page = await browser.newPage();
  const relativeModelPath = modelPath.replace(path.join(__dirname, 'public'), '').replace(/\\/g, '/');
  const url = `http://localhost:3000/preview.html?model=${relativeModelPath}`;

  console.log(`Generating thumbnail for: ${relativeModelPath}`);

  await page.goto(url);
  await new Promise(resolve => setTimeout(resolve, 2000));
// Give time to render

  await page.screenshot({ path: thumbnailPath });
  await page.close();
}

function walkModels(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(walkModels(fullPath));
    } else if (file.endsWith('.glb')) {
      results.push(fullPath);
    }
  });

  return results;
}

(async () => {
  const browser = await puppeteer.launch();
  const models = walkModels(assetsRoot);

  for (const model of models) {
    const relPath = path.relative(assetsRoot, model);
    const category = path.dirname(relPath);
    const baseName = path.basename(relPath, '.glb');

    const thumbDir = path.join(thumbnailsRoot, category);
    const thumbPath = path.join(thumbDir, `${baseName}.png`);

    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    if (!fs.existsSync(thumbPath)) {
      await generateThumbnail(browser, model, thumbPath);
    } else {
      console.log(`Thumbnail exists: ${thumbPath}`);
    }
  }

  await browser.close();
})();
