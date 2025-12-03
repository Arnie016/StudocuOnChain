# StudocuOnChain upload demo plan

This document outlines a minimal end-to-end demo that proves uploading a file, persisting it to decentralized storage, and registering it on-chain with the existing `StudocuOnChain` contract. The focus is a tiny React/ethers front end that uses web3.storage (IPFS) for file blobs and interacts with the deployed contract.

## Architecture overview
- **Storage:** web3.storage (IPFS) for primary persistence with automatic pinning; optional Arweave mirror via Bundlr as a follow-up.
- **Smart contract:** use `StudocuOnChain` unchanged; deploy to a low-cost L2 testnet (Base Sepolia / Polygon Amoy) for inexpensive uploads and votes.
- **Client:** minimal React page inside `InterfaceDemo/src` with wallet connect, file picker, and two calls: (1) upload file to IPFS and get CID; (2) call `registerDocument` on the contract with CID + password hash + fees. It then shows status and voting progress by reading contract views.
- **Indexing (optional for the demo):** poll contract view functions; later swap to The Graph for scalability.

## Prerequisites
- **Env vars:**
  - `VITE_WEB3_STORAGE_TOKEN` (web3.storage API token) or `REACT_APP_WEB3_STORAGE_TOKEN` depending on build setup.
  - `VITE_RPC_URL` (L2 RPC endpoint) and `VITE_CONTRACT_ADDRESS` (deployed `StudocuOnChain` address).
- **Wallet:** MetaMask configured to chosen L2 testnet with faucet funds for tx fees.
- **Node deps:** `npm install web3.storage ethers@5` inside `InterfaceDemo` (React app).

## Deployment steps
1. **Deploy contract**
   - Use Hardhat/Foundry to deploy `StudocuOnChain.sol` to the L2 testnet; record the address and owner account.
2. **Configure client**
   - Set the env vars above in `.env` inside `InterfaceDemo`.
   - Add a small helper file, e.g., `src/lib/storage.ts`, that instantiates `Web3Storage` with the token.
3. **Implement uploader component** (new React component)
   - UI: file input, optional password field, and register button.
   - On submit:
     1. Call `web3Storage.put([file])` to get an IPFS CID.
     2. Hash password locally (`ethers.utils.keccak256(ethers.utils.toUtf8Bytes(password))`).
     3. Connect wallet via `window.ethereum` and call `registerDocument(cid, passwordHash, {value: registrationFee + uploadDeposit + accessFee})` using the ABI from `StudocuOnChain`.
     4. Show toast/status with CID and tx hash.
   - After tx confirmation, call `getDocMetadata(docId)` (or equivalent view) to display quorum, approval counts, and password availability.
4. **Voting flow demo**
   - Render list of documents (by iterating `docs` mapping up to `docCount`) with vote buttons calling `vote(docId, approve)`.
   - Display progress: approvals vs. rejections, status, and CID/password once approved.
5. **Persistence check**
   - Use a public gateway (e.g., `https://w3s.link/ipfs/<cid>`) to fetch the uploaded file and verify it matches local hash.

## Minimal code sketches
- **web3.storage helper**
  ```ts
  import { Web3Storage } from 'web3.storage';

  export function makeStorageClient() {
    return new Web3Storage({ token: import.meta.env.VITE_WEB3_STORAGE_TOKEN });
  }
  ```
- **Upload + register action**
  ```ts
  const cid = await makeStorageClient().put([file], { wrapWithDirectory: false });
  const passwordHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(password || ''));
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, StudocuAbi, signer);
  const fee = await contract.registrationFee();
  const deposit = await contract.uploadDeposit();
  const accessFee = await contract.accessFee();
  const tx = await contract.registerDocument(cid, passwordHash, { value: fee.add(deposit).add(accessFee) });
  await tx.wait();
  ```

## Validation checklist
- Upload succeeds and returns CID; file retrievable via gateway URL.
- Contract transaction mined; doc metadata reflects new entry with stored CID and password hash.
- Voting buttons succeed from multiple wallets; approval threshold unlocks password/IPFS access data.
- Front end shows live counts; optional indexer can replace polling later.

## Stretch improvements (post-demo)
- Add Arweave mirror via Bundlr for permanence; store both CID and Arweave tx-id.
- Introduce The Graph subgraph for reactive lists and filters.
- Batch pinning and gateway fallbacks (web3.storage + Pinata) for resiliency.
- Add file integrity verification by hashing the file client-side and comparing after download.
