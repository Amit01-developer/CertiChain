import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=================================================");
  console.log("  CertiChain Registry — Deployment");
  console.log("=================================================");
  console.log(`Network  : ${network.name}`);
  console.log(`Deployer : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance  : ${ethers.formatEther(balance)} MATIC\n`);

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 balance. Get testnet MATIC from https://faucet.polygon.technology"
    );
  }

  console.log("Deploying CertiChainRegistry...");
  const Registry = await ethers.getContractFactory("CertiChainRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const txHash  = registry.deploymentTransaction()?.hash ?? "unknown";

  console.log("\n✓ Contract deployed!");
  console.log(`  Address  : ${address}`);
  console.log(`  Tx Hash  : ${txHash}`);
  console.log(`  Explorer : https://amoy.polygonscan.com/address/${address}`);

  console.log("\n─── Next steps ─────────────────────────────────────");
  console.log("1. Copy the contract address above.");
  console.log("2. Open your root .env file.");
  console.log("3. Set BLOCKCHAIN_CONTRACT_ADDRESS=" + address);
  console.log("4. Restart the backend server.");
  console.log("────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
