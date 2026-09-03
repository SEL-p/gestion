const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\salou\\.gemini\\antigravity-ide\\brain\\e5600879-8685-4f76-b616-109a73b1aa29\\.user_uploaded\\media_1788429869103.png';
const publicDir = path.join(__dirname, '..', 'public');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

async function processLogo() {
  console.log('🎨 Processing TRANSPARENT USER LOGO from:', srcPath);

  // 1. Copy exact original to public/logo.png
  fs.copyFileSync(srcPath, path.join(publicDir, 'logo.png'));
  console.log('✅ Copied transparent logo to public/logo.png');

  // 2. Square icon 512x512 with white background and balanced margin
  const logoBuffer512 = await sharp(srcPath)
    .resize(420, 420, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: logoBuffer512, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✅ Generated public/icon-512.png');

  // Also duplicate to icon.png
  fs.copyFileSync(path.join(publicDir, 'icon-512.png'), path.join(publicDir, 'icon.png'));

  // 3. 192x192 icon
  const logoBuffer192 = await sharp(srcPath)
    .resize(156, 156, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: logoBuffer192, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✅ Generated public/icon-192.png');

  // 4. Favicon (64x64)
  const logoBuffer64 = await sharp(srcPath)
    .resize(52, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: logoBuffer64, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✅ Generated public/favicon.png');

  // 5. Android mipmap icons
  // Adaptive icons have 108dp base:
  // mdpi: 48 / adaptive 108
  // hdpi: 72 / adaptive 162
  // xhdpi: 96 / adaptive 216
  // xxhdpi: 144 / adaptive 324
  // xxxhdpi: 192 / adaptive 432
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48, adaptive: 108 },
    { dir: 'mipmap-hdpi', size: 72, adaptive: 162 },
    { dir: 'mipmap-xhdpi', size: 96, adaptive: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, adaptive: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, adaptive: 432 },
  ];

  // Remove legacy capacitor vector foreground if present so Android strictly uses mipmap PNGs
  const oldV24Foreground = path.join(androidResDir, 'drawable-v24', 'ic_launcher_foreground.xml');
  if (fs.existsSync(oldV24Foreground)) {
    fs.unlinkSync(oldV24Foreground);
    console.log('🗑️ Removed legacy drawable-v24/ic_launcher_foreground.xml');
  }

  for (const m of mipmaps) {
    const targetDir = path.join(androidResDir, m.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // A. Standard ic_launcher.png (White background with 15% inner padding)
    const innerSize = Math.round(m.size * 0.82);
    const logoInner = await sharp(srcPath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: m.size,
        height: m.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: logoInner, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // B. ic_launcher_round.png (Circular white badge with logo inside)
    const roundMask = Buffer.from(
      `<svg><circle cx="${m.size / 2}" cy="${m.size / 2}" r="${m.size / 2}" fill="#fff"/></svg>`
    );
    await sharp({
      create: {
        width: m.size,
        height: m.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        { input: logoInner, gravity: 'center' },
        { input: roundMask, blend: 'dest-in' }
      ])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // C. ic_launcher_foreground.png (for Android Adaptive Icons)
    // Safe zone is 66% of adaptive size
    const adaptiveLogoSize = Math.round(m.adaptive * 0.65);
    const adaptiveLogoInner = await sharp(srcPath)
      .resize(adaptiveLogoSize, adaptiveLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: m.adaptive,
        height: m.adaptive,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: adaptiveLogoInner, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`✅ Generated Android icons for ${m.dir} (${m.size}x${m.size} standard, ${m.adaptive}x${m.adaptive} adaptive)`);
  }

  console.log('\n🎉 Transparent logo processed for Web, Mobile, and Android APK!');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
