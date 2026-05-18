import "dotenv/config";

const required = (name, fallback = undefined) => {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  publicAppUrl: required("PUBLIC_APP_URL", "http://localhost:3000"),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  siweDomain: required("SIWE_DOMAIN", "localhost:3000"),
  platformFeeBps: Number(process.env.PLATFORM_FEE_BPS || 1000),
  adminWallets: (process.env.ADMIN_WALLETS || "")
    .split(",")
    .map((wallet) => wallet.trim().toLowerCase())
    .filter(Boolean),
  chain: {
    rpcUrl: required("CHAIN_RPC_URL", "https://rpc.sepolia.org"),
    chainId: Number(required("CHAIN_ID", "11155111")),
    studocuContractAddress: required("STUDOCU_CONTRACT_ADDRESS")
  },
  storage: {
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || undefined,
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    bucket: required("OBJECT_STORAGE_BUCKET"),
    accessKeyId: required("OBJECT_STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: required("OBJECT_STORAGE_SECRET_ACCESS_KEY")
  }
};
