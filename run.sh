#!/usr/bin/env bash
set -euo pipefail

# ---------- Configuración ----------
COMPOSE_FILE="docker-compose.yaml"
ENV_FILE=".env"
ENV_TEMPLATE=".env.example.docker"

# ---------- Helpers ----------
usage() {
  cat <<EOF
Uso: $0 <comando> [--build]

Comandos obligatorios:
  dev     Levanta el stack en modo desarrollo (nextjs).
  prod    Levanta el stack en modo producción (nextjs).
  off     Detiene cualquier stack (dev o prod) en ejecución, sin borrar volúmenes.
  reset   Detiene los stacks y elimina volúmenes y redes huérfanas del proyecto.

Opciones:
  --build  Fuerza la reconstrucción de las imágenes antes de levantar los servicios.

Ejemplos:
  ./run.sh dev            # Levanta entorno de desarrollo (usa caché si la imagen no cambió)
  ./run.sh prod           # Levanta entorno de producción (usa caché si la imagen no cambió)
  ./run.sh dev --build    # Reconstruye imágenes y levanta entorno de desarrollo
  ./run.sh prod --build   # Reconstruye imágenes y levanta entorno de producción
  ./run.sh off            # Detiene dev/prod manteniendo los datos
  ./run.sh reset          # Detiene todo y borra volúmenes del proyecto
EOF
  exit 1
}

ensure_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "⚠️  No se encontró $ENV_FILE, creando a partir de $ENV_TEMPLATE…"
    cp "$ENV_TEMPLATE" "$ENV_FILE"
  fi
}

load_compose_project_name() {
  if [[ -z "${COMPOSE_PROJECT_NAME-}" ]]; then
    COMPOSE_PROJECT_NAME=$(
      grep -E '^COMPOSE_PROJECT_NAME=' "$ENV_FILE" \
        | cut -d= -f2- \
        | tr -d '"'
    )
    export COMPOSE_PROJECT_NAME
  fi
}

project_name() {
  echo "${COMPOSE_PROJECT_NAME}-${1}"
}

docker_down_all() {
  for m in dev prod; do
    docker compose \
      -p "$(project_name "$m")" \
      -f "$COMPOSE_FILE" \
      down "$@" || true
  done
}

docker_up() {
  local mode=$1; shift
  docker compose \
    -p "$(project_name "$mode")" \
    -f "$COMPOSE_FILE" \
    up -d "$@"
}

# ---------- Main ----------
ensure_env
load_compose_project_name

[ $# -lt 1 ] && usage

MODE=$1; shift
BUILD_FLAG=""
[ "${1-:-}" = "--build" ] && BUILD_FLAG="--build"

case "$MODE" in
  off)
    docker_down_all
    exit 0
    ;;
  reset)
    docker_down_all -v --remove-orphans
    exit 0
    ;;
  dev)
    ENV_VALUE=development
    ;;
  prod)
    ENV_VALUE=production
    ;;
  *)
    usage
    ;;
esac

echo "🔧 Ajustando ENVIRONMENT=$ENV_VALUE en $ENV_FILE…"
sed -i -E "s/^ENVIRONMENT=.*\$/ENVIRONMENT=${ENV_VALUE}/" "$ENV_FILE"

echo "🔄 Cerrando entornos previos…"
docker_down_all

echo "🚀 Arrancando '$MODE' ($(project_name "$MODE"))…"
docker_up "$MODE" $BUILD_FLAG

echo "✅ Entorno '$MODE' listo. (Proyecto: $(project_name "$MODE"))"
