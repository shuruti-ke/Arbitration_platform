#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://raw.githubusercontent.com/shuruti-ke/Arbitration_platform/main}"
APP="${APP:-/home/opc/arbitration-platform}"
PM2_NAME="${PM2_NAME:-arbitration-backend}"

cd "$APP"
mkdir -p releases
tar -czf "releases/pre-curl-deploy-$(date +%Y%m%d%H%M%S).tgz" src scripts package.json package-lock.json 2>/dev/null || true

fetch() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  curl -fsSL "$BASE/$src" -o "$dest.tmp"
  mv "$dest.tmp" "$dest"
  echo "updated $dest"
}

fetch package.json package.json
fetch ecosystem.config.js ecosystem.config.js
fetch scripts/run-migrations.js scripts/run-migrations.js
fetch scripts/wait-for-ready.sh scripts/wait-for-ready.sh
fetch src/index.js src/index.js
fetch src/services/logger.js src/services/logger.js
fetch src/services/audit-trail.js src/services/audit-trail.js
fetch src/services/consent-service.js src/services/consent-service.js
fetch src/services/hearing-service.js src/services/hearing-service.js
fetch src/services/neon-database-service.js src/services/neon-database-service.js
fetch src/services/user-service.js src/services/user-service.js

source /home/opc/.nvm/nvm.sh
node --check src/index.js
node --check src/services/logger.js
node --check scripts/run-migrations.js
npm run migrate
pm2 delete "$PM2_NAME" || true
pm2 start ecosystem.config.js --only "$PM2_NAME" --env production
pm2 save
sleep 8
pm2 status
chmod +x scripts/wait-for-ready.sh
./scripts/wait-for-ready.sh
