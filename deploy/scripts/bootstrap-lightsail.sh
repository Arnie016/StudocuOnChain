#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y git curl ca-certificates nginx certbot python3-certbot-nginx postgresql-client rsync ufw openssl

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq '^v(20|22)\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo useradd --system --create-home --shell /usr/sbin/nologin studocu 2>/dev/null || true
sudo mkdir -p /opt/studocuonchain/releases /opt/studocuonchain/shared /opt/studocuonchain/frontend/build
sudo chown -R studocu:studocu /opt/studocuonchain

sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw --force enable

if [ ! -f /etc/studocuonchain.env ]; then
  sudo install -o root -g root -m 600 /dev/null /etc/studocuonchain.env
  echo "Created /etc/studocuonchain.env. Fill it before starting the API."
fi

if [ ! -s /etc/studocuonchain.env ]; then
  JWT_SECRET="$(openssl rand -hex 32)"
  sudo tee /etc/studocuonchain.env >/dev/null <<EOF
NODE_ENV=production
PORT=8787
PUBLIC_APP_URL=http://54.251.144.94

DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/studocuonchain

OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_BUCKET=studocuonchain-private
OBJECT_STORAGE_ACCESS_KEY_ID=replace-me
OBJECT_STORAGE_SECRET_ACCESS_KEY=replace-me

CHAIN_RPC_URL=https://rpc.sepolia.org
CHAIN_ID=11155111
STUDOCU_CONTRACT_ADDRESS=0xf751BB12227808FD05BdF78917063b876A01F7c9

JWT_SECRET=$JWT_SECRET
SIWE_DOMAIN=54.251.144.94
PLATFORM_FEE_BPS=1000
ADMIN_WALLETS=
EOF
  sudo chmod 600 /etc/studocuonchain.env
fi

echo "Bootstrap complete. Next: edit /etc/studocuonchain.env, install nginx/systemd templates, and deploy."
