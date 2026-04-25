#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://127.0.0.1:3000/api/ready}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"
deadline=$((SECONDS + TIMEOUT_SECONDS))

while (( SECONDS < deadline )); do
  if body="$(curl -fsS --max-time 5 "$URL" 2>/dev/null)"; then
    case "$body" in
      *'"status":"ready"'*|*'"status":"OK"'*)
        printf '%s\n' "$body"
        exit 0
        ;;
    esac
  fi
  sleep "$SLEEP_SECONDS"
done

echo "Timed out waiting for readiness at $URL" >&2
exit 1
