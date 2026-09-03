const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\salou\\.gemini\\antigravity-ide\\brain\\e5600879-8685-4f76-b616-109a73b1aa29\\.user_uploaded\\media_1788428715390.png';
const publicDir = path.join(__dirname, '..', 'public');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

async function processLogo() {
  console.log('🎨 Processing USER REAL LOGO from:', srcPath);

  // 1. Copy exact original to public/logo.png
  fs.copyFileSync(srcPath, path.join(publicDir, 'logo.png'));
  console.log('✅ Copied to public/logo.png');

  // 2. Square icon 512x512 with subtle white padding
  await sharp(srcPath)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✅ Generated public/icon-512.png');

  // Also duplicate to icon.png for general use
  fs.copyFileSync(path.join(publicDir, 'icon-512.png'), path.join(publicDir, 'icon.png'));

  // 3. 192x192 icon
  await sharp(srcPath)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✅ Generated public/icon-192.png');

  // 4. Favicon (64x64)
  await sharp(srcPath)
    .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✅ Generated public/favicon.png');

  // 5. Android mipmap icons
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const m of mipmaps) {
    const targetDir = path.join(androidResDir, m.dir);
    if (fs.existsSync(targetDir)) {
      // Standard icon (contained on white background)
      await sharp(srcPath)
        .resize(m.size, m.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetDir, 'ic_launcher.png'));

      // Round icon (with circular mask)
      const roundedCorners = Buffer.from(
        `<svg><rect x="0" y="0" width="${m.size}" height="${m.size}" rx="${m.size / 2}" ry="${m.size / 2}"/></svg>`
      );
      await sharp(srcPath)
        .resize(m.size, m.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .composite([{ input: roundedCorners, blend: 'dest-in' }])
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_round.png'));

      // Foreground icon
      await sharp(srcPath)
        .resize(m.size, m.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

      console.log(`✅ Generated Android icons for ${m.dir} (${m.size}x${m.size})`);
    }
  }

  console.log('\n🎉 Real user logo processed for Web, Mobile, and Android APK!');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
