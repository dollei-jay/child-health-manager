#!/usr/bin/env bash
set -euo pipefail

# child-health-manager restore script
# Usage: ./scripts/restore.sh <backup_tar.gz> [target_dir]

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_tar.gz> [target_dir]" >&2
  exit 1
fi

BACKUP_FILE="$1"
APP_DIR_DEFAULT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${2:-$APP_DIR_DEFAULT}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "[ERROR] backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [[ -f "$BACKUP_FILE.sha256" ]]; then
  echo "[INFO] verifying checksum..."
  (cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$BACKUP_FILE").sha256")
fi

echo "[RISK] this operation will overwrite target data/. Continue? (yes/no)"
read -r ans
if [[ "$ans" != "yes" ]]; then
  echo "[ABORT] restore cancelled"
  exit 0
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

tar -xzf "$BACKUP_FILE" -C "$TMP_DIR"

mkdir -p "$TARGET_DIR"

if [[ -d "$TMP_DIR/data" ]]; then
  rm -rf "$TARGET_DIR/data"
  cp -a "$TMP_DIR/data" "$TARGET_DIR/data"
fi

if [[ -f "$TMP_DIR/.env" ]]; then
  cp "$TMP_DIR/.env" "$TARGET_DIR/.env"
fi

if [[ -f "$TMP_DIR/docker-compose.yml" ]]; then
  cp "$TMP_DIR/docker-compose.yml" "$TARGET_DIR/docker-compose.yml"
fi

echo "[OK] restore complete"
echo "[NEXT] run: cd $TARGET_DIR && docker compose up -d"
