#!/usr/bin/env bash
set -euo pipefail

# verify backup archive integrity
# Usage: ./scripts/verify-backup.sh <backup_tar.gz>

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_tar.gz>" >&2
  exit 1
fi

FILE="$1"

if [[ ! -f "$FILE" ]]; then
  echo "[ERROR] file not found: $FILE" >&2
  exit 1
fi

if [[ ! -f "$FILE.sha256" ]]; then
  echo "[ERROR] checksum file missing: $FILE.sha256" >&2
  exit 1
fi

(cd "$(dirname "$FILE")" && sha256sum -c "$(basename "$FILE").sha256")

echo "[OK] backup checksum verified"
