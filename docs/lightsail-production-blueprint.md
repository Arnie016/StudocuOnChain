# Lightsail Production Blueprint

This blueprint turns the current `StudocuOnChain` demo into a production-oriented marketplace for student-created study sheets. The current React app and Sepolia contract prove the core loop, but production needs a backend, private file storage, moderation, and a safer access model.

## Target Shape

```text
Browser / Wallet
  |
  | HTTPS
  v
Nginx on AWS Lightsail
  |-----------------------------|
  v                             v
React static app          Node API service
                                |
                                | SQL + object storage + chain RPC
                                v
                     Postgres / RDS or Lightsail DB
                     S3 or Cloudflare R2 private bucket
                     EVM network contract
```

Use Sepolia for staging. Use a low-fee EVM L2 such as Base, Optimism, Arbitrum, or Polygon for real payments.

## What Moves Off-Chain

Do not store document passwords or private content on-chain. Anyone can read chain storage.

Store these in the backend/database:

- Listing metadata: title, course, school, tags, description, price.
- Creator profile and payout address.
- File object key and preview object key.
- Moderation status.
- Purchase records and access grants.
- Audit events.

Store these in private object storage:

- Original PDF or sheet file.
- Preview image or watermarked preview PDF.

Keep these on-chain:

- Purchase/payment event.
- Creator payout accounting, if using contract escrow.
- Optional listing id hash or content hash.
- Optional access proof.

## Lightsail Instance

Recommended starting instance:

- Ubuntu 24.04 LTS
- 2 GB RAM minimum for frontend + Node API
- Static IP attached
- Ports open: `22`, `80`, `443`
- Restrict `22` to your IP when possible

Server packages:

```bash
sudo apt-get update
sudo apt-get install -y git curl ca-certificates nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo useradd --system --create-home --shell /usr/sbin/nologin studocu || true
sudo mkdir -p /opt/studocuonchain
sudo chown -R studocu:studocu /opt/studocuonchain
```

## Environment File

Keep secrets outside the repo:

```bash
sudo install -o root -g root -m 600 /dev/null /etc/studocuonchain.env
sudoedit /etc/studocuonchain.env
```

Minimum shape:

```dotenv
NODE_ENV=production
PORT=8787
PUBLIC_APP_URL=https://app.example.com

DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/studocuonchain

OBJECT_STORAGE_PROVIDER=s3
OBJECT_STORAGE_BUCKET=studocuonchain-private
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=...
OBJECT_STORAGE_SECRET_ACCESS_KEY=...

CHAIN_RPC_URL=https://sepolia.infura.io/v3/...
CHAIN_ID=11155111
STUDOCU_CONTRACT_ADDRESS=0xf751BB12227808FD05BdF78917063b876A01F7c9

JWT_SECRET=...
SIWE_DOMAIN=app.example.com
PLATFORM_FEE_BPS=1000
```

## Systemd API Service

Create `/etc/systemd/system/studocuonchain-api.service`:

```ini
[Unit]
Description=StudocuOnChain marketplace API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=studocu
Group=studocu
WorkingDirectory=/opt/studocuonchain/api
EnvironmentFile=/etc/studocuonchain.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Enable after deploying the API:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now studocuonchain-api
sudo journalctl -u studocuonchain-api -n 80 --no-pager
curl -fsS http://127.0.0.1:8787/health
```

## Nginx

Serve the React build and proxy `/api` to the backend:

```nginx
server {
    listen 80;
    server_name app.example.com;

    root /opt/studocuonchain/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8787/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

TLS:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d app.example.com
```

## Backend API Surface

Start with this API:

```text
GET  /health
POST /auth/nonce
POST /auth/verify-siwe
GET  /me

POST /listings
GET  /listings
GET  /listings/:id
POST /listings/:id/upload-url
POST /listings/:id/submit-for-review
POST /listings/:id/moderation

POST /purchases/:listingId/intent
POST /purchases/:listingId/verify
GET  /purchases
GET  /access/:listingId/download-url

GET  /creator/earnings
POST /creator/withdraw
```

## Database Tables

Minimum schema:

```text
users
  id, wallet_address, display_name, created_at

listings
  id, creator_user_id, title, school, course, tags, description,
  price_wei, file_object_key, preview_object_key,
  content_hash, status, created_at, updated_at

purchases
  id, listing_id, buyer_user_id, tx_hash, chain_id,
  amount_wei, platform_fee_wei, creator_amount_wei,
  status, created_at

access_grants
  id, listing_id, user_id, purchase_id, expires_at, created_at

moderation_events
  id, listing_id, reviewer_user_id, status, reason, created_at

creator_ledger
  id, creator_user_id, purchase_id, amount_wei, status, created_at
```

## Production Purchase Flow

1. Creator signs in with wallet.
2. Creator creates listing metadata.
3. Backend returns a private upload URL.
4. Creator uploads file to private storage.
5. Backend creates preview/watermark and marks listing `pending_review`.
6. Admin or reviewers approve listing.
7. Buyer purchases on-chain or through a backend-created payment intent.
8. Backend verifies the transaction against the chain RPC.
9. Backend creates `purchase` and `access_grant`.
10. Buyer receives a short-lived signed download URL.
11. Creator earnings are updated.

## Contract Direction

Replace the demo contract with a marketplace contract before real money:

```solidity
createListing(bytes32 contentHash, uint256 priceWei)
purchase(uint256 listingId)
hasAccess(address user, uint256 listingId)
withdrawEarnings()
setPlatformFee(uint16 feeBps)
```

Avoid on-chain passwords. Use on-chain events as the payment/access source of truth, then let the backend deliver files.

## Deployment Checklist

1. Create Lightsail instance and static IP.
2. Point DNS `A` record to the static IP.
3. Install Node, nginx, certbot.
4. Create `/etc/studocuonchain.env`.
5. Deploy frontend build to `/opt/studocuonchain/frontend/build`.
6. Deploy backend API to `/opt/studocuonchain/api`.
7. Enable `studocuonchain-api.service`.
8. Configure nginx and TLS.
9. Verify `/health`, frontend routes, wallet login, upload, purchase verification.
10. Add monitoring, backups, and database snapshots.

## Immediate Next Build Step

Add an `api/` workspace with Express or Fastify, Postgres migrations, SIWE auth, private storage upload URLs, and `/health`. Keep Sepolia as staging until the new contract and access model are ready.
