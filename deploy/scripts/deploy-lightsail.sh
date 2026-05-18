#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/OWNER/REPO.git}"
BRANCH="${BRANCH:-main}"
RELEASE_DIR="/opt/studocuonchain/releases/$(date +%Y%m%d%H%M%S)"
CURRENT_LINK="/opt/studocuonchain/current"

sudo mkdir -p "$RELEASE_DIR"
sudo chown -R studocu:studocu "$RELEASE_DIR"

sudo -u studocu git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$RELEASE_DIR"

cd "$RELEASE_DIR/InterfaceDemo"
sudo -u studocu npm ci
sudo -u studocu npm run build

cd "$RELEASE_DIR/api"
sudo -u studocu npm ci --omit=dev

sudo ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
sudo mkdir -p /opt/studocuonchain/frontend
sudo rsync -a "$RELEASE_DIR/InterfaceDemo/build/" /opt/studocuonchain/frontend/build/
sudo chown -R studocu:studocu /opt/studocuonchain/frontend/build

sudo systemctl daemon-reload
sudo systemctl restart studocuonchain-api
sudo nginx -t
sudo systemctl reload nginx

sleep 2
systemctl --no-pager --full status studocuonchain-api
curl -fsS http://127.0.0.1:8787/health
