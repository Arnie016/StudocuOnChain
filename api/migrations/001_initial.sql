create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists siwe_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists siwe_nonces_wallet_nonce_idx on siwe_nonces(wallet_address, nonce);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references users(id),
  title text not null,
  school text not null default '',
  course text not null default '',
  tags text[] not null default '{}',
  description text not null default '',
  price_wei numeric(78, 0) not null,
  file_object_key text,
  preview_object_key text,
  content_hash text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'hidden')),
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_created_at_idx on listings(status, created_at desc);
create index if not exists listings_creator_user_id_idx on listings(creator_user_id);

create table if not exists review_assignments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  reviewer_user_id uuid not null references users(id),
  status text not null default 'assigned' check (status in ('assigned', 'voted', 'expired')),
  vote text check (vote in ('approve', 'reject')),
  reason text,
  assigned_at timestamptz not null default now(),
  voted_at timestamptz,
  unique (listing_id, reviewer_user_id)
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_user_id uuid not null references users(id),
  tx_hash text not null unique,
  chain_id integer not null,
  amount_wei numeric(78, 0) not null,
  platform_fee_wei numeric(78, 0) not null default 0,
  creator_amount_wei numeric(78, 0) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists purchases_listing_id_idx on purchases(listing_id);
create index if not exists purchases_buyer_user_id_idx on purchases(buyer_user_id);

create table if not exists access_grants (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  user_id uuid not null references users(id),
  purchase_id uuid references purchases(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create table if not exists moderation_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  reviewer_user_id uuid references users(id),
  status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists creator_ledger (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references users(id),
  purchase_id uuid references purchases(id),
  amount_wei numeric(78, 0) not null,
  status text not null default 'pending' check (status in ('pending', 'available', 'withdrawn', 'reversed')),
  created_at timestamptz not null default now(),
  available_at timestamptz
);

create table if not exists chain_events (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  contract_address text not null,
  tx_hash text not null,
  log_index integer not null,
  event_name text not null,
  payload jsonb not null default '{}',
  block_number bigint not null,
  created_at timestamptz not null default now(),
  unique (chain_id, tx_hash, log_index)
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
