const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname);
const APP_DIR = path.join(__dirname, '../src/app');

const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#5B21B6" />
    </linearGradient>
  </defs>
  
  <path d="M 256 32 C 320 48 400 64 440 76 C 445 77 448 81 448 86 C 448 240 416 360 262 476 C 258 479 254 479 250 476 C 96 360 64 240 64 86 C 64 81 67 77 72 76 C 112 64 192 48 256 32 Z" fill="url(#bg)" />

  <g transform="translate(0, 8)">
    <path d="M 256 270 L 256 384" stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 256 310 L 160 360" stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 256 310 L 352 360" stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
    
    <circle cx="256" cy="384" r="24" fill="white" />
    <circle cx="160" cy="360" r="24" fill="white" />
    <circle cx="352" cy="360" r="24" fill="white" />
    
    <path d="M 112 180 L 256 100 L 400 180 L 256 260 Z" fill="white" />
    
    <path d="M 184 220 V 270 C 184 310 328 310 328 270 V 220" fill="none" stroke="white" stroke-width="24" stroke-linecap="round" />
    
    <path d="M 400 180 V 250" fill="none" stroke="white" stroke-width="16" stroke-linecap="round" />
    <circle cx="400" cy="266" r="16" fill="white" />
  </g>
</svg>`;

const MANIFEST_CONTENT = `{
  "name": "Smart Campus ERP",
  "short_name": "Smart Campus",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#7C3AED",
  "background_color": "#ffffff",
  "display": "standalone"
}`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), SVG_CONTENT);
fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), MANIFEST_CONTENT);

console.log("SVG and Manifest created.");

// Generate PNGs and ICO using sharp and png-to-ico
async function generate() {
  console.log("Installing sharp and png-to-ico temporarily...");
  execSync('npm install --no-save sharp png-to-ico', { stdio: 'inherit' });

  const sharp = require('sharp');
  const pngToIco = require('png-to-ico');

  const svgBuffer = Buffer.from(SVG_CONTENT);
  
  console.log("Generating PNGs...");
  await sharp(svgBuffer).resize(16, 16).png().toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));

  console.log("Generating ICO...");
  const pngToIcoModule = require('png-to-ico');
  const pngToIcoFn = pngToIcoModule.default || pngToIcoModule;
  const buf = await pngToIcoFn([path.join(PUBLIC_DIR, 'favicon-32x32.png')]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buf);
  
  // also drop in app dir for Next.js App Router overrides
  fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), buf);
  fs.writeFileSync(path.join(APP_DIR, 'icon.svg'), SVG_CONTENT);
  fs.writeFileSync(path.join(APP_DIR, 'apple-icon.png'), await sharp(svgBuffer).resize(180, 180).png().toBuffer());

  console.log("Assets generated successfully!");
}

generate().catch(console.error);
