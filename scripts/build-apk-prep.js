const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📱 ===================================================');
console.log('📱 PRÉPARATION DU PROJET ZEYNARMARKET POUR APK ANDROID');
console.log('📱 ===================================================\n');

// 1. Check public/manifest.json
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.log('⚙️ Génération du fichier manifest.json...');
  const manifestData = {
    name: "ZEYNARMARKET - Caisse & Supermarché",
    short_name: "Zeynarmarket",
    description: "Application de Caisse Tactile & Gestion de Supermarché",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#004D40",
    theme_color: "#004D40",
    icons: [
      {
        src: "/icon.svg",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
  console.log('✅ manifest.json généré avec succès dans ./public/ manifest.json');
} else {
  console.log('✅ manifest.json est présent.');
}

// 2. Check capacitor.config.json
const capConfigPath = path.join(__dirname, '..', 'capacitor.config.json');
if (!fs.existsSync(capConfigPath)) {
  console.log('⚙️ Génération du fichier capacitor.config.json...');
  const capData = {
    appId: "com.zeynarmarket.pos",
    appName: "ZEYNARMARKET",
    webDir: "public",
    bundledWebRuntime: false,
    server: {
      url: "http://10.0.2.2:3000",
      cleartext: true
    }
  };
  fs.writeFileSync(capConfigPath, JSON.stringify(capData, null, 2));
  console.log('✅ capacitor.config.json généré.');
} else {
  console.log('✅ capacitor.config.json est présent.');
}

// 3. Garantir la permission CAMERA dans android/app/src/main/AndroidManifest.xml
//    Le dossier android/ est ignore par git : apres un « npx cap add android », la permission
//    doit etre reinjectee sinon la camera en direct (getUserMedia dans la WebView) est refusee.
const androidManifestPath = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml'
);

const ensureCameraPermission = (xml) => {
  let out = xml;

  if (!out.includes('android.permission.CAMERA')) {
    const cameraPermission = [
      '<uses-permission android:name="android.permission.INTERNET" />',
      '    <!-- Requis par navigator.mediaDevices.getUserMedia() dans la WebView (prise de photo en direct) -->',
      '    <uses-permission android:name="android.permission.CAMERA" />',
    ].join('\n    ');

    if (out.includes('<uses-permission android:name="android.permission.INTERNET" />')) {
      out = out.replace('<uses-permission android:name="android.permission.INTERNET" />', cameraPermission);
    } else {
      out = out.replace('<application', '    <uses-permission android:name="android.permission.CAMERA" />\n\n    <application');
    }
  }

  if (!out.includes('android.hardware.camera')) {
    out = out.replace(
      '</manifest>',
      [
        '    <uses-feature android:name="android.hardware.camera" android:required="false" />',
        '    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />',
        '</manifest>',
      ].join('\n')
    );
  }

  return out;
};

if (fs.existsSync(androidManifestPath)) {
  const originalManifest = fs.readFileSync(androidManifestPath, 'utf8');
  const patchedManifest = ensureCameraPermission(originalManifest);

  if (patchedManifest !== originalManifest) {
    fs.writeFileSync(androidManifestPath, patchedManifest);
    console.log('✅ Permission CAMERA ajoutee a android/app/src/main/AndroidManifest.xml');
  } else {
    console.log('✅ Permission CAMERA deja presente dans AndroidManifest.xml');
  }
} else {
  console.log('⚠️  android/app/src/main/AndroidManifest.xml introuvable.');
  console.log('    Lancez « npx cap add android » puis relancez ce script pour injecter la permission CAMERA.');
}

console.log('\n🚀 Tous les fichiers de préparation APK sont prêts !');
console.log('📄 Consultez le fichier BUILD_APK.md pour générer votre fichier .APK en 1 clic.');
