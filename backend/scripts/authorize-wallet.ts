/**
 * authorize-wallet.ts
 *
 * Ye script:
 *  1. BLOCKCHAIN_PRIVATE_KEY se wallet address nikalta hai
 *  2. Check karta hai ki wallet authorized hai ya nahi
 *  3. Agar nahi hai, toh contract ke owner wallet se authorizeIssuer call karta hai
 *
 * Usage:
 *   npx ts-node scripts/authorize-wallet.ts
 *
 * Owner private key env se uthata hai (BLOCKCHAIN_PRIVATE_KEY).
 * Agar owner alag hai toh BLOCKCHAIN_OWNER_PRIVATE_KEY set kar sakte ho.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { ethers } from 'ethers';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── ABI (sirf jo functions chahiye) ──────────────────────────────────────────
const ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'issuer', type: 'address' }],
    name: 'authorizedIssuers',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Common function names — contract mein jo bhi ho
  {
    inputs: [{ internalType: 'address', name: 'issuer', type: 'address' }],
    name: 'authorizeIssuer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'issuer', type: 'address' }],
    name: 'addAuthorizedIssuer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'issuer', type: 'address' }],
    name: 'addIssuer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// ── Config ───────────────────────────────────────────────────────────────────
const RPC_URL          = process.env.BLOCKCHAIN_RPC_URL!;
const PRIVATE_KEY      = process.env.BLOCKCHAIN_PRIVATE_KEY!;
const OWNER_KEY        = process.env.BLOCKCHAIN_OWNER_PRIVATE_KEY ?? PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS!;
const CHAIN_ID         = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? '80002');

function required(val: string | undefined, name: string): string {
  if (!val) { console.error(`❌  Missing env: ${name}`); process.exit(1); }
  return val;
}

async function main() {
  required(RPC_URL,          'BLOCKCHAIN_RPC_URL');
  required(PRIVATE_KEY,      'BLOCKCHAIN_PRIVATE_KEY');
  required(CONTRACT_ADDRESS, 'BLOCKCHAIN_CONTRACT_ADDRESS');

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // ── Network check ──────────────────────────────────────────────────────────
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`\n🌐  Connected to chainId: ${chainId}`);
  if (chainId !== CHAIN_ID) {
    console.error(`❌  Wrong network! Expected ${CHAIN_ID} (Polygon Amoy), got ${chainId}.`);
    process.exit(1);
  }
  console.log('✅  Network: Polygon Amoy');

  // ── Wallets ────────────────────────────────────────────────────────────────
  const issuerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const ownerWallet  = new ethers.Wallet(OWNER_KEY,   provider);
  console.log(`\n🔑  Issuer wallet  : ${issuerWallet.address}`);
  console.log(`🔑  Owner wallet   : ${ownerWallet.address}`);

  // ── Balances ───────────────────────────────────────────────────────────────
  const ownerBalance = await provider.getBalance(ownerWallet.address);
  console.log(`💰  Owner balance  : ${ethers.formatEther(ownerBalance)} MATIC`);

  if (ownerBalance === 0n) {
    console.error('\n❌  Owner wallet has 0 MATIC. Gas ke liye MATIC chahiye.');
    console.error('    Faucet: https://faucet.polygon.technology  (owner address paste karo)');
    process.exit(1);
  }

  // ── Contract (read-only pehle) ─────────────────────────────────────────────
  const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // Contract owner
  let contractOwner: string | null = null;
  try {
    contractOwner = await (readContract as any).owner();
    console.log(`\n📄  Contract owner : ${contractOwner}`);
  } catch {
    console.log('\n⚠️   Contract owner() function nahi mila — skipping owner check.');
  }

  // Already authorized?
  let isAuthorized = false;
  try {
    isAuthorized = await (readContract as any).authorizedIssuers(issuerWallet.address);
    console.log(`🔐  Is authorized  : ${isAuthorized}`);
  } catch {
    console.log('⚠️   authorizedIssuers() check nahi ho saka.');
  }

  if (isAuthorized) {
    console.log('\n✅  Wallet already authorized hai! Kuch karne ki zarurat nahi.');
    process.exit(0);
  }

  // ── Authorization check ────────────────────────────────────────────────────
  if (contractOwner &&
      ownerWallet.address.toLowerCase() !== contractOwner.toLowerCase()) {
    console.error(`\n❌  Owner wallet address contract owner se match nahi karta!`);
    console.error(`    Contract owner : ${contractOwner}`);
    console.error(`    Your wallet    : ${ownerWallet.address}`);
    console.error('\n    Fix: Contract deploy karne wale wallet ka private key');
    console.error('    BLOCKCHAIN_OWNER_PRIVATE_KEY=<owner_private_key> set karo .env mein');
    process.exit(1);
  }

  // ── Authorize ──────────────────────────────────────────────────────────────
  const writeContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, ownerWallet);

  // Try different function names
  const authFunctions = ['authorizeIssuer', 'addAuthorizedIssuer', 'addIssuer'];
  let authorized = false;

  for (const fnName of authFunctions) {
    if (typeof (writeContract as any)[fnName] !== 'function') continue;

    console.log(`\n⏳  Calling ${fnName}(${issuerWallet.address}) ...`);
    try {
      const tx = await (writeContract as any)[fnName](issuerWallet.address);
      console.log(`📤  Tx sent: ${tx.hash}`);
      console.log('⏳  Waiting for confirmation...');
      const receipt = await tx.wait(1);
      console.log(`\n✅  Authorized! Tx confirmed in block ${receipt.blockNumber}`);
      console.log(`🔗  Explorer: https://amoy.polygonscan.com/tx/${receipt.hash}`);
      authorized = true;
      break;
    } catch (err: any) {
      console.error(`❌  ${fnName}() failed: ${err?.shortMessage ?? err?.message}`);
    }
  }

  if (!authorized) {
    console.error('\n❌  Koi bhi authorize function kaam nahi kiya.');
    console.error('    Contract mein authorizeIssuer/addAuthorizedIssuer/addIssuer functions check karo.');
    console.error('    Ya contract ko Remix IDE se manually call karo:');
    console.error('    https://remix.ethereum.org → At Address → ' + CONTRACT_ADDRESS);
    process.exit(1);
  }

  // ── Verify ─────────────────────────────────────────────────────────────────
  try {
    const check = await (readContract as any).authorizedIssuers(issuerWallet.address);
    console.log(`\n🔐  Verification: authorizedIssuers = ${check}`);
    if (!check) {
      console.warn('⚠️   Transaction confirm hua lekin authorizedIssuers abhi bhi false hai. Thoda wait karo.');
    }
  } catch {
    console.log('⚠️   Final verification check skip — transaction successful tha.');
  }
}

main().catch(err => {
  console.error('\n💥  Script failed:', err?.message ?? err);
  process.exit(1);
});
