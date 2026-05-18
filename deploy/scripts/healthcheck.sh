#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"

systemctl is-active studocuonchain-api
curl -fsS http://127.0.0.1:8787/health

if [ -n "$DOMAIN" ]; then
  curl -fsS "https://${DOMAIN}/health"
fi
