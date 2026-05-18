#!/usr/bin/env bash
set -euo pipefail

APP_HOST="${APP_HOST:-54.251.144.94}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

sudo install -o root -g root -m 644 "${DEPLOY_DIR}/systemd/studocuonchain-api.service" /etc/systemd/system/studocuonchain-api.service

tmp_nginx="$(mktemp)"
sed "s/app.example.com/${APP_HOST}/g" "${DEPLOY_DIR}/nginx/studocuonchain.conf" > "$tmp_nginx"
sudo install -o root -g root -m 644 "$tmp_nginx" /etc/nginx/sites-available/studocuonchain.conf
rm -f "$tmp_nginx"

sudo ln -sfn /etc/nginx/sites-available/studocuonchain.conf /etc/nginx/sites-enabled/studocuonchain.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl daemon-reload

echo "Installed nginx and systemd config for ${APP_HOST}."
