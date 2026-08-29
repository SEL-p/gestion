# 📱 Guide d'Extraction et de Génération du Fichier APK Android

Ce guide explique comment extraire et compiler votre application **ZEYNARMARKET** en fichier **.APK** pour l'installer sur des téléphones, tablettes ou terminaux de caisse Android.

---

## ⚡ Méthode 1 : Installation Directe PWA (Sans compilation, 10 secondes)

Cette méthode ne nécessite aucune installation logicielle complexe et installe l'application directement comme une application native avec son icône sur votre écran d'accueil Android.

1. **Connecter le téléphone et l'ordinateur au même réseau Wi-Fi**.
2. Récupérer l'adresse IP de votre PC (ex: `http://192.168.1.50:3000`).
3. Ouvrir **Google Chrome** sur le téléphone Android et aller à cette adresse.
4. Appuyer sur le **menu 3 points** (en haut à droite de Chrome).
5. Appuyer sur **« Ajouter à l'écran d'accueil »** ou **« Installer l'application »**.
6. 🎉 L'application est installée sous forme d'application dédiée avec son icône !

---

## 🛠️ Méthode 2 : Génération APK via PWABuilder / Bubblewrap (Recommandé - 2 min)

Permet de générer un fichier `.apk` officiel installable en 2 minutes.

1. Téléchargez la CLI Bubblewrap ou PWABuilder :
   ```bash
   npx @bubblewrap/cli init --manifest=http://localhost:3000/manifest.json
   ```
2. Ou rendez-vous sur le site officiel [PWABuilder](https://www.pwabuilder.com/).
3. Entrez l'URL de votre serveur ou IP locale.
4. Cliquez sur **« Package for Android »** puis **« Download APK »**.
5. Récupérez le fichier `app-release-signed.apk` ou `app-debug.apk`.

---

## 🏗️ Méthode 3 : Compilation APK via Capacitor & Android Studio (Natif)

Pour compiler un fichier `.apk` autonome avec Android Studio :

### Étape 1 : Installer Capacitor Android dans le projet
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Étape 2 : Initialiser le projet Android
```bash
npx cap init ZEYNARMARKET com.zeynarmarket.pos --web-dir public
npx cap add android
```

### Étape 3 : Configurer l'URL de votre serveur dans `capacitor.config.json`
Éditez le fichier `capacitor.config.json` et remplacez par votre IP locale ou domaine :
```json
{
  "appId": "com.zeynarmarket.pos",
  "appName": "ZEYNARMARKET",
  "webDir": "public",
  "server": {
    "url": "http://192.168.1.50:3000",
    "cleartext": true
  }
}
```

### Étape 4 : Générer l'APK dans Android Studio
```bash
npx cap open android
```
Dans Android Studio :
1. Allez dans le menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Une fois la compilation terminée, cliquez sur **Locate**.
3. Votre fichier `app-debug.apk` se trouve dans le dossier `android/app/build/outputs/apk/debug/`.
