# CertiChain — Blockchain Setup Guide

This guide walks through deploying the `CertiChainRegistry` smart contract to Polygon Amoy Testnet and wiring it into the CertiChain backend.

---

## Overview

```
Certificate PDF
     ↓
SHA-256 Hash
     ↓
Polygon Amoy Blockchain  ←  CertiChainRegistry.sol
     ↓
Immutable Hash Proof
     ↓
QR Verification
```

Only the certificate hash, certificate ID, issuer address, timestamp, and revocation status are stored on-chain. No PDFs or personal data ever touch the blockchain.

---

## Prerequisites

- Node.js 18+
- A wallet with a private key (MetaMask export, or generate one with `node -e "const {ethers}=require('ethers'); console.log(ethers.Wallet.createRandom().privateKey)"`)
- MATIC on Polygon Amoy testnet (free from the faucet — see step 3)

---

## Step 1 — Install dependencies

Install the Hardhat project dependencies:

```bash
cd blockchain
npm install
```

Install ethers.js in the backend:

```bash
cd backend
npm install ethers@^6
```

---

## Step 2 — Configure environment variables

Copy `.env.example` to `.env` (if you haven't already) and fill in the blockchain section:

```env
BLOCKCHAIN_ENABLED=false          # keep false until contract is deployed
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BLOCKCHAIN_CONTRACT_ADDRESS=      # filled in after deploy (step 4)
BLOCKCHAIN_CHAIN_ID=80002
BLOCKCHAIN_EXPLORER_URL=https://amoy.polygonscan.com
VITE_BLOCKCHAIN_EXPLORER_URL=https://amoy.polygonscan.com
```

> **Security:** Never commit your private key. Add `.env` to `.gitignore` (it already is in this project).

---

## Step 3 — Get Polygon Amoy testnet funds

1. Open [https://faucet.polygon.technology](https://faucet.polygon.technology)
2. Connect your wallet or paste your address
3. Select **Polygon Amoy** and request MATIC
4. Wait ~30 seconds for the transaction to confirm

You only need a small amount (0.1 MATIC is more than enough for deployment + many transactions).

---

## Step 4 — Compile and deploy the contract

```bash
cd blockchain

# Compile
npm run compile

# Deploy to Amoy
npm run deploy:amoy
```

Successful output looks like:

```
=================================================
  CertiChain Registry — Deployment
=================================================
Network  : amoy
Deployer : 0xYourAddress
Balance  : 0.5 MATIC

Deploying CertiChainRegistry...

✓ Contract deployed!
  Address  : 0xABC123...
  Tx Hash  : 0xDEF456...
  Explorer : https://amoy.polygonscan.com/address/0xABC123...
```

---

## Step 5 — Add contract address and enable blockchain

1. Copy the **Address** from the deploy output
2. Open your root `.env` file
3. Set:

```env
BLOCKCHAIN_CONTRACT_ADDRESS=0xABC123...
BLOCKCHAIN_ENABLED=true
```

---

## Step 6 — Run database migration

The blockchain fields need to be applied to the database:

```bash
cd backend
npx prisma migrate deploy
```

Or in development:

```bash
npx prisma migrate dev
```

---

## Step 7 — Start the backend and frontend

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

---

## Step 8 — Test certificate issuance and verification

1. Log in to the dashboard at `http://localhost:5173`
2. Issue a new certificate — the backend will:
   - Generate the PDF and SHA-256 hash
   - Save to the database (always succeeds)
   - Register the hash on Polygon Amoy (non-blocking)
3. Open the public verification page `/verify/<certId>`
4. You should see the **Blockchain Verification** panel showing:
   - `✓ Blockchain Verified`
   - Network: Polygon Amoy
   - Transaction hash with explorer link

---

## Running the smart contract tests

```bash
cd blockchain
npm test
```

The test suite covers:
1. Register certificate
2. Duplicate registration rejected
3. Correct hash verified
4. Wrong hash returns `exists: false`
5. Certificate revoked on-chain
6. Unauthorized registration/revocation rejected

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `BLOCKCHAIN_ENABLED` | Yes | `true` to enable blockchain integration |
| `BLOCKCHAIN_RPC_URL` | Yes | Amoy RPC endpoint |
| `BLOCKCHAIN_PRIVATE_KEY` | Yes | Wallet private key for signing transactions |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Yes | Deployed contract address |
| `BLOCKCHAIN_CHAIN_ID` | No | Chain ID (default: `80002` for Amoy) |
| `BLOCKCHAIN_EXPLORER_URL` | No | Explorer base URL for transaction links |
| `VITE_BLOCKCHAIN_EXPLORER_URL` | No | Same URL exposed to the frontend |

---

## Error handling

If the blockchain is unavailable during certificate issuance:

- The certificate is **always saved to the database** first
- `blockchainStatus` is set to `FAILED`
- The error is logged and an audit event `BLOCKCHAIN_FAILED` is recorded
- Certificate issuance completes normally — users are not affected

The admin dashboard stats (`/api/admin/stats`) expose `blockchain.failed`, `blockchain.confirmed`, and `blockchain.pending` counts so you can monitor the health of blockchain registrations.

---

## Local testing (without deploying to Amoy)

You can test with a local Hardhat node:

```bash
# Terminal 1
cd blockchain
npm run node

# Terminal 2 — deploy locally
npm run deploy:local
```

Then set in `.env`:

```env
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=<one of the local hardhat accounts>
BLOCKCHAIN_CONTRACT_ADDRESS=<local deploy address>
BLOCKCHAIN_ENABLED=true
```

---

## Contract address

| Network | Address |
|---|---|
| Polygon Amoy Testnet | *(fill in after deploy)* |

> Update this table after deployment.
