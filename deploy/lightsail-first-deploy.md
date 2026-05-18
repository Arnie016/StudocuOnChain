# Lightsail First Deploy

Instance:

- Public IPv4: `54.251.144.94`
- User: `ubuntu`
- App user: `studocu`
- API port: `8787`
- Public HTTP: `80`

## 1. SSH Into The Instance

Use the Lightsail browser SSH client first. That avoids local key setup while the instance is new.

## 2. Bootstrap The Server

From the instance, run:

```bash
sudo apt-get update
sudo apt-get install -y git
```

Then copy or clone this repo and run:

```bash
cd studocuonchain
bash deploy/scripts/bootstrap-lightsail.sh
APP_HOST=54.251.144.94 bash deploy/scripts/install-lightsail-config.sh
```

## 3. Fill Production Environment

Edit:

```bash
sudo nano /etc/studocuonchain.env
```

Minimum values that must be real before the app works:

```dotenv
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/studocuonchain
OBJECT_STORAGE_BUCKET=...
OBJECT_STORAGE_ACCESS_KEY_ID=...
OBJECT_STORAGE_SECRET_ACCESS_KEY=...
CHAIN_RPC_URL=https://rpc.sepolia.org
STUDOCU_CONTRACT_ADDRESS=0xf751BB12227808FD05BdF78917063b876A01F7c9
JWT_SECRET=...
PUBLIC_APP_URL=http://54.251.144.94
SIWE_DOMAIN=54.251.144.94
```

Use Supabase or Neon for `DATABASE_URL`. Use S3 or Cloudflare R2 for object storage.

## 4. Deploy From This Mac

Once the default Lightsail SSH key is available locally:

```bash
REMOTE_HOST=54.251.144.94 REMOTE_USER=ubuntu bash deploy/scripts/sync-lightsail.sh
```

The script syncs the local checkout, builds the React app, installs API dependencies, runs migrations, restarts systemd, reloads nginx, and checks `/health`.

## 5. Verify

On the instance:

```bash
curl -fsS http://127.0.0.1:8787/health
curl -fsS http://127.0.0.1:8787/version
sudo systemctl status studocuonchain-api --no-pager
sudo journalctl -u studocuonchain-api -n 80 --no-pager
```

From your browser:

```text
http://54.251.144.94
http://54.251.144.94/health
```

## 6. Add Domain Later

After the IP works, point an `A` record to `54.251.144.94`, rerun:

```bash
APP_HOST=your-domain.example bash deploy/scripts/install-lightsail-config.sh
sudo certbot --nginx -d your-domain.example
```

Then update `/etc/studocuonchain.env`:

```dotenv
PUBLIC_APP_URL=https://your-domain.example
SIWE_DOMAIN=your-domain.example
```
