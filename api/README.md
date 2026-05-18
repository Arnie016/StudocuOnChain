# StudocuOnChain API

Production backend scaffold for the Loki Unchained / StudocuOnChain marketplace.

## What This Enables

- Wallet sign-in with SIWE and JWT sessions.
- User profiles tied to wallet addresses.
- Listing creation and search.
- Private object storage upload URLs.
- Review and admin moderation scaffolding.
- Purchase verification against an EVM RPC.
- Signed download URLs for users with access grants.
- Creator listings and earnings views.

## Local Setup

```bash
cd api
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

The API expects Postgres and S3-compatible object storage credentials. For local development, use a local Postgres database and either AWS S3, Cloudflare R2, or a local S3-compatible service.

## Routes

```text
GET    /health
GET    /version

POST   /api/auth/nonce
POST   /api/auth/verify-siwe
GET    /api/me
PATCH  /api/me

GET    /api/listings
POST   /api/listings
GET    /api/listings/:id
POST   /api/listings/:id/upload-url
POST   /api/listings/:id/submit-for-review

GET    /api/review/queue
POST   /api/review/:listingId/vote

GET    /api/admin/listings/pending
POST   /api/admin/listings/:id/moderation

GET    /api/purchases
POST   /api/purchases/:listingId/intent
POST   /api/purchases/:listingId/verify
GET    /api/access/:listingId/download-url

GET    /api/creator/listings
GET    /api/creator/earnings
```

## Production Notes

This is a server scaffold, not yet the complete production marketplace. The next implementation pass should connect the React frontend to these routes, replace the demo on-chain password flow, and deploy a marketplace-specific contract for listing purchases and creator payout accounting.
