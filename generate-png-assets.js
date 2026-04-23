const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAssets() {
  const assetsDir = path.join(__dirname, 'assets');

  // Create app icon (1024x1024) - orange gradient with fitness theme
  const iconSVG = Buffer.from(`
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="226" fill="url(#grad)"/>
      <g transform="translate(512, 512)">
        <circle cx="0" cy="-50" r="180" fill="white" opacity="0.15"/>
        <path d="M -150 -50 L 0 100 L 150 -50" stroke="white" stroke-width="50" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `);

  await sharp(iconSVG)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  console.log('✓ Generated icon.png (1024x1024)');

  // Create splash screen (1284x2778 for modern iPhones)
  const splashSVG = Buffer.from(`
    <svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="splashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#111827;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1284" height="2778" fill="url(#splashGrad)"/>
      <g transform="translate(642, 1300)">
        <circle cx="0" cy="0" r="120" fill="#f97316" opacity="0.2"/>
        <circle cx="0" cy="0" r="90" fill="#f97316" opacity="0.4"/>
        <circle cx="0" cy="0" r="60" fill="#f97316"/>
        <path d="M -40 0 L 0 40 L 40 0" stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `);

  await sharp(splashSVG)
    .resize(1284, 2778)
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));

  console.log('✓ Generated splash.png (1284x2778)');
}

generateAssets().catch(console.error);
