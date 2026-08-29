# CI/CD pour `SEL-p/gestion`

Ce kit met en place le flux suivant :

```text
IDE → git commit → git push origin main → GitHub Actions → GHCR → VPS → makaya_app
```

Le serveur actuel utilise Podman et `conmon`. Podman sait exécuter les images OCI construites par les actions Docker ; le pipeline n’a donc pas besoin de remplacer le runtime existant.

## 1. Ajouter les fichiers au dépôt

Copier les deux éléments suivants dans le dépôt `SEL-p/gestion` :

```text
.github/workflows/ci-cd.yml
deploy/remote-deploy.sh
```

Le workflow valide le lint et le build, construit l’image avec le SHA du commit, la publie dans GitHub Container Registry, puis la déploie par SSH. Avant le premier déploiement, remplacer le contenu du `Dockerfile` par celui fourni dans `Dockerfile.cicd`, ou appliquer au minimum la modification du script de démarrage afin de ne plus exécuter `prisma db push --accept-data-loss` automatiquement.

## 2. Préparer les secrets sur le VPS

Créer un fichier de variables de production hors Git :

```bash
sudo install -m 600 /dev/null /root/opt/zenab/gestion/.env.production
sudo nano /root/opt/zenab/gestion/.env.production
```

Le fichier doit contenir au minimum :

```env
DATABASE_URL=mysql://root:MOT_DE_PASSE_MYSQL@makaya_db:3306/catalog_db
NODE_ENV=production
PORT=3000
```

Utiliser le vrai mot de passe actuel de MySQL. Ne jamais committer ce fichier.

Le conteneur MySQL existant et son volume `mysql_data` sont conservés. Le script de déploiement ne supprime ni ne recrée la base.

## 3. Préparer l’accès de lecture au registre GHCR

Créer sur GitHub un Personal Access Token à durée limitée avec uniquement `read:packages`, puis l’utiliser une seule fois sur le VPS :

```bash
sudo podman login ghcr.io -u SEL-p
```

Saisir le token lorsque Podman le demande. Ne pas mettre le token dans GitHub Actions ni dans le dépôt. Si le package GHCR est rendu public, cette connexion n’est pas nécessaire, mais un package privé est préférable pour la production.

## 4. Préparer l’utilisateur SSH de déploiement

Il est préférable de ne pas utiliser `root` depuis GitHub Actions. Créer un utilisateur dédié :

```bash
sudo useradd --create-home --shell /bin/bash deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

Ajouter la clé publique de déploiement dans :

```bash
sudo nano /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Installer ensuite le script sur le VPS, une seule fois, depuis votre poste de développement :

```bash
scp deploy/remote-deploy.sh deploy@191.215.42.54:/tmp/gestion-deploy.sh
ssh deploy@191.215.42.54 'sudo install -o root -g root -m 750 /tmp/gestion-deploy.sh /usr/local/sbin/gestion-deploy.sh && sudo rm -f /tmp/gestion-deploy.sh'
```

Autoriser uniquement ce script via sudo :

```bash
sudo visudo -f /etc/sudoers.d/gestion-deploy
```

Contenu recommandé :

```text
deploy ALL=(root) NOPASSWD: /usr/local/sbin/gestion-deploy.sh
```

Le workflow appelle alors uniquement `/usr/local/sbin/gestion-deploy.sh` et ne copie aucun fichier arbitraire sur le serveur à chaque exécution.

Créer une clé dédiée depuis votre poste ou votre IDE :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/gestion-cicd -C "github-actions-gestion" -N ""
ssh-copy-id -i ~/.ssh/gestion-cicd.pub deploy@191.215.42.54
ssh-keyscan -H 191.215.42.54
```

Conservez la sortie de `ssh-keyscan` pour `VPS_KNOWN_HOSTS`, et copiez le contenu de `~/.ssh/gestion-cicd` dans `VPS_SSH_KEY`. Ne partagez jamais cette clé privée dans une conversation ou dans le dépôt.

## 5. Ajouter les secrets GitHub

Dans `Settings → Secrets and variables → Actions`, créer ces secrets :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | `191.215.42.54` |
| `VPS_PORT` | `22` |
| `VPS_USER` | `deploy` ou l’utilisateur SSH choisi |
| `VPS_SSH_KEY` | Clé privée SSH complète, jamais la clé publique |
| `VPS_KNOWN_HOSTS` | Sortie de `ssh-keyscan -H 191.215.42.54` |

Créer aussi l’environnement GitHub `production`. Il peut être configuré avec une approbation manuelle si chaque déploiement doit être validé ; sinon le push sur `main` déploie automatiquement.

## 6. Mode d’utilisation quotidien depuis l’IDE

Après une modification :

```bash
git status
git add .
git commit -m "décrire la modification"
git push origin main
```

Le workflow se déclenche automatiquement. Un `push` sur une autre branche exécute seulement les contrôles si le workflow est étendu à ces branches ; la production reste attachée à `main`.

## 7. Migrations Prisma

Le Dockerfile actuel exécute `prisma db push --accept-data-loss` au démarrage. Cette commande est dangereuse avec les données métier présentes dans MySQL. Pour la production, il faut retirer cette commande du démarrage automatique et utiliser des migrations Prisma contrôlées, avec sauvegarde de la base avant modification.

Le pipeline fourni teste la construction et déploie l’application, mais ne lance aucune migration destructive. Une migration doit être traitée séparément : sauvegarde, validation du SQL, exécution manuelle ou étape protégée, puis déploiement.

## 8. Retour arrière

Le script teste la nouvelle image sur un port temporaire avant de remplacer `makaya_app`. Si le contrôle `/login` échoue après remplacement, il tente de relancer l’image précédente. Les images sont taguées par SHA, ce qui permet également de redéployer précisément une version connue.

## 9. Contrôles après déploiement

```bash
sudo podman ps
sudo podman logs --tail 100 makaya_app
curl -I https://zeynamarket.store/
sudo nginx -t
```

La réponse attendue du site est une redirection `307` vers `/login` pour les utilisateurs non authentifiés.
