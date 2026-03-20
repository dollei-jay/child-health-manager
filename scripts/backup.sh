#!/usr/bin/env bash
set -euo pipefail

# child-health-manager backup script
# Usage: ./scripts/backup.sh [backup_dir]

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${1:-$APP_DIR/backups}"
DATA_DIR="$APP_DIR/data"
DB_FILE="$APP_DIR/database.sqlite"
ENV_FILE="$APP_DIR/.env"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"

mkdir -p "$BACKUP_DIR"

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/child-health-manager-backup-$TS.tar.gz"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [[ -d "$DATA_DIR" ]]; then
  cp -a "$DATA_DIR" "$TMP_DIR/data"
elif [[ -f "$DB_FILE" ]]; then
  mkdir -p "$TMP_DIR/data"
  cp "$DB_FILE" "$TMP_DIR/data/database.sqlite"
else
  echo "[WARN] no data source found (neither $DATA_DIR nor $DB_FILE), creating metadata-only backup" >&2
  mkdir -p "$TMP_DIR/data"
  echo "EMPTY_DATA_BACKUP" > "$TMP_DIR/data/.empty"
fi

[[ -f "$ENV_FILE" ]] && cp "$ENV_FILE" "$TMP_DIR/.env"
[[ -f "$COMPOSE_FILE" ]] && cp "$COMPOSE_FILE" "$TMP_DIR/docker-compose.yml"

echo "[INFO] creating backup: $OUT"
tar -czf "$OUT" -C "$TMP_DIR" .

SHA_FILE="$OUT.sha256"
sha256sum "$OUT" > "$SHA_FILE"

echo "[OK] backup created"
echo "[OK] archive: $OUT"
echo "[OK] checksum: $SHA_FILE"
