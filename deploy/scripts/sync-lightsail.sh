#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-54.251.144.94}"
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
RELEASE_ID="${RELEASE_ID:-$(date +%Y%m%d%H%M%S)}"
REMOTE_RELEASE_DIR="/opt/studocuonchain/releases/${RELEASE_ID}"
REMOTE_CURRENT_LINK="/opt/studocuonchain/current"
LOCAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Syncing ${LOCAL_ROOT} to ${REMOTE}:${REMOTE_RELEASE_DIR}"

ssh "$REMOTE" "sudo mkdir -p '${REMOTE_RELEASE_DIR}' /opt/studocuonchain/frontend/build && sudo chown -R '${REMOTE_USER}:${REMOTE_USER}' '${REMOTE_RELEASE_DIR}' /opt/studocuonchain/frontend"

rsync -az --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "InterfaceDemo/build" \
  --exclude "InterfaceDemo/node_modules" \
  --exclude "api/node_modules" \
  "$LOCAL_ROOT/" "$REMOTE:${REMOTE_RELEASE_DIR}/"

ssh "$REMOTE" bash -s <<EOF
set -euo pipefail

cd "${REMOTE_RELEASE_DIR}/InterfaceDemo"
npm ci
npm run build

cd "${REMOTE_RELEASE_DIR}/api"
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

sudo ln -sfn "${REMOTE_RELEASE_DIR}" "${REMOTE_CURRENT_LINK}"
sudo rsync -a "${REMOTE_RELEASE_DIR}/InterfaceDemo/build/" /opt/studocuonchain/frontend/build/
sudo chown -R studocu:studocu /opt/studocuonchain

cd "${REMOTE_CURRENT_LINK}/api"
sudo bash -lc 'set -a; source /etc/studocuonchain.env; set +a; npm run db:migrate'

sudo systemctl daemon-reload
sudo systemctl enable studocuonchain-api
sudo systemctl restart studocuonchain-api
sudo nginx -t
sudo systemctl reload nginx

sleep 2
curl -fsS http://127.0.0.1:8787/health
EOF

echo "Deployment complete: http://${REMOTE_HOST}"
