# Loki Unchained

Loki Unchained is an on-chain notes marketplace for uploading, reviewing, and unlocking approved study documents. The current Solidity contract is still named `StudocuOnChain`, but the product-facing app now uses the Loki Unchained brand consistently.

## Live Deployment

- Production dApp (Vercel): <https://interface-demo-vert.vercel.app/>

## Current Network

- Supported network: Sepolia (`0xaa36a7`)
- Contract address: `0xf751BB12227808FD05BdF78917063b876A01F7c9`
- Explorer: <https://sepolia.etherscan.io/address/0xf751BB12227808FD05BdF78917063b876A01F7c9#code>
- Contract name: `StudocuOnChain`

## Sova Testnet

The interface has first-class wallet metadata for the Sova test network:

- Chain ID: `120893` (`0x1d83d`)
- RPC URL: <https://rpc.testnet.sova.io>
- Explorer: <https://explorer.testnet.sova.io>
- Native currency symbol: `SOVA`

To run this app on Sova, deploy `StudocuOnChain.sol` and `Leader_election.sol` to Sova, then set:

```bash
REACT_APP_SUPPORTED_CHAIN_ID=0x1d83d
REACT_APP_STUDOCU_CONTRACT_ADDRESS=<sova-studocu-contract-address>
REACT_APP_LEADER_CONTRACT_ADDRESS=<sova-leader-contract-address>
```

Without Sova deployment addresses, the frontend can add/switch MetaMask to Sova but contract actions should remain pointed at the Sepolia deployment.

Key contract constants:

- `REGISTRATION_FEE = 0.01 ETH`
- `UPLOAD_DEPOSIT = 0.005 ETH` (refunded on approval)
- `VOTE_REWARD = 0.005 ETH`
- `ACCESS_FEE = 0.001 ETH`
- `APPROVAL_THRESHOLD = 3` of `REQUIRED_VOTERS = 5`

## Product Highlights

- Wallet onboarding with MetaMask detection and unsupported-network guardrails.
- Registration flow with clear fee/status states.
- Upload flow for IPFS hashes, document passwords, and fallback document links.
- Reviewer queue for assigned votes, preview links, and voter rewards.
- Approved-document access flow with password retrieval and recent access history.
- Profile dashboard with wallet status, uploads, assigned votes, completed votes, and network stats.
- CI build check via GitHub Actions.

## Configuration

Copy `InterfaceDemo/.env.example` to `InterfaceDemo/.env.local` for local overrides:

```bash
REACT_APP_DAPP_NAME=Loki Unchained
REACT_APP_SUPPORTED_CHAIN_ID=0xaa36a7
REACT_APP_STUDOCU_CONTRACT_ADDRESS=0xf751BB12227808FD05BdF78917063b876A01F7c9
REACT_APP_LEADER_CONTRACT_ADDRESS=0x6779a2E6EC961f2C59a677849AD0edacCDb15453
```

To ship a new production network, redeploy `StudocuOnChain.sol`, verify the address on the target explorer, then update the `REACT_APP_*` deployment values.

## Repository Layout

```text
StudocuOnChain/
├── InterfaceDemo/          # React dApp + contract sources
│   ├── src/
│   │   ├── components/     # UI modules
│   │   ├── config/         # dApp/network configuration
│   │   ├── contracts/      # Solidity + ABI configs
│   │   └── utils/          # Helpers
├── docs/                   # Architecture assets
└── .github/workflows/      # CI checks
```

## Local Development

```bash
cd InterfaceDemo
npm install
npm start
```

For production builds:

```bash
npm run build
```

## Deployment

```bash
vercel
vercel --prod
```

The root `vercel.json` keeps SPA routing working for deep links by rewriting non-static paths to `index.html`.

## Security Note

The current demo contract stores document passwords on-chain. Use disposable document-specific passwords only. A production-grade follow-up should replace this with encrypted off-chain secrets or token-gated key delivery.
