#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="${1:-${IMAGE:-}}"
if [[ -z "$IMAGE" ]]; then
  echo "IMAGE est obligatoire, par exemple ghcr.io/sel-p/gestion:sha-..." >&2
  exit 1
fi
APP_DIR="${APP_DIR:-/root/opt/zenab/gestion}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
APP_NAME="${APP_NAME:-makaya_app}"
CANDIDATE_NAME="${APP_NAME}_candidate"
APP_PORT="${APP_PORT:-3000}"
CHECK_PORT="${CHECK_PORT:-3001}"

if [[ ! "$IMAGE" =~ ^ghcr\.io/[^[:space:]]+:[^[:space:]]+$ ]]; then
  echo "Image refusée : le nom doit être une image GHCR taguée." >&2
  exit 1
fi

if ! command -v podman >/dev/null 2>&1; then
  echo "Podman est introuvable sur le serveur." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Fichier de secrets absent : $ENV_FILE" >&2
  echo "Créez-le sur le serveur ; ne le commitez jamais dans GitHub." >&2
  exit 1
fi

cd "$APP_DIR"

# Le conteneur MySQL existant définit le réseau à conserver. Le volume MySQL n'est jamais touché.
DB_NAME="${DB_NAME:-makaya_db}"
NETWORK="$(podman inspect --format '{{range $name, $network := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$DB_NAME" 2>/dev/null | head -n 1 | tr -d '\r')"
if [[ -z "$NETWORK" ]]; then
  echo "Impossible de trouver le réseau du conteneur $DB_NAME." >&2
  exit 1
fi

OLD_IMAGE="$(podman inspect --format '{{.Config.Image}}' "$APP_NAME" 2>/dev/null || true)"

cleanup_candidate() {
  podman rm -f "$CANDIDATE_NAME" >/dev/null 2>&1 || true
}
trap cleanup_candidate EXIT

# Télécharge l'image avant toute interruption de production.
podman pull "$IMAGE"

# Teste la nouvelle image sur un port temporaire et avec le réseau MySQL existant.
cleanup_candidate
podman run --detach \
  --name "$CANDIDATE_NAME" \
  --network "$NETWORK" \
  --env-file "$ENV_FILE" \
  --publish "127.0.0.1:${CHECK_PORT}:3000" \
  "$IMAGE" >/dev/null

ready=0
for _ in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 3 "http://127.0.0.1:${CHECK_PORT}/login" >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done

if [[ "$ready" != 1 ]]; then
  echo "Le conteneur candidat ne répond pas. Déploiement annulé." >&2
  podman logs --tail 100 "$CANDIDATE_NAME" >&2 || true
  exit 1
fi

cleanup_candidate
trap - EXIT

# Remplace uniquement l'application. Le conteneur et le volume MySQL restent intacts.
podman rm -f "$APP_NAME" >/dev/null 2>&1 || true
podman run --detach \
  --name "$APP_NAME" \
  --network "$NETWORK" \
  --env-file "$ENV_FILE" \
  --publish "127.0.0.1:${APP_PORT}:3000" \
  --restart always \
  "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 3 "http://127.0.0.1:${APP_PORT}/login" >/dev/null; then
    echo "Déploiement réussi : $IMAGE"
    exit 0
  fi
  sleep 2
done

echo "La nouvelle version ne répond pas. Tentative de retour arrière." >&2
podman logs --tail 100 "$APP_NAME" >&2 || true
podman rm -f "$APP_NAME" >/dev/null 2>&1 || true

if [[ -n "$OLD_IMAGE" ]]; then
  podman run --detach \
    --name "$APP_NAME" \
    --network "$NETWORK" \
    --env-file "$ENV_FILE" \
    --publish "127.0.0.1:${APP_PORT}:3000" \
    --restart always \
    "$OLD_IMAGE" >/dev/null
  echo "Retour arrière lancé vers : $OLD_IMAGE" >&2
fi
exit 1
