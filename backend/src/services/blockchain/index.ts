import { ethers } from 'ethers';
import { env }    from '../../config/env';
import { logger } from '../../utils/logger';
import { REGISTRY_ABI } from './abi';

export interface RegisterResult {
  success:     boolean;
  txHash?:     string;
  network?:    string;
  error?:      string;
}

export interface VerifyResult {
  onChain:   boolean;
  exists:    boolean;
  revoked:   boolean;
  issuer:    string;
  timestamp: number;
  certId:    string;
  hashMatch: boolean;
  error?:    string;
}

class BlockchainService {
  private provider:  ethers.JsonRpcProvider | null = null;
  private signer:    ethers.Wallet            | null = null;
  private contract:  ethers.Contract          | null = null;
  private networkName = 'Polygon Amoy';

  private init(): boolean {
    if (this.contract) return true;

    if (!env.BLOCKCHAIN_ENABLED) return false;

    if (!env.BLOCKCHAIN_RPC_URL || !env.BLOCKCHAIN_PRIVATE_KEY || !env.BLOCKCHAIN_CONTRACT_ADDRESS) {
      logger.warn('[Blockchain] Missing configuration. Set BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, BLOCKCHAIN_CONTRACT_ADDRESS.');
      return false;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
      this.signer   = new ethers.Wallet(env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
      this.contract = new ethers.Contract(
        env.BLOCKCHAIN_CONTRACT_ADDRESS,
        REGISTRY_ABI,
        this.signer,
      );
      logger.info(`[Blockchain] Initialized — contract ${env.BLOCKCHAIN_CONTRACT_ADDRESS} on ${this.networkName}`);
      return true;
    } catch (err: any) {
      logger.error('[Blockchain] Initialization failed', { error: err?.message });
      return false;
    }
  }

  private async assertCorrectNetwork(): Promise<void> {
    if (!this.provider || !this.signer || !this.contract) {
      throw new Error('Blockchain client is not initialized.');
    }

    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== env.BLOCKCHAIN_CHAIN_ID) {
      throw new Error(
        `Blockchain network mismatch. Expected Polygon Amoy (chainId ${env.BLOCKCHAIN_CHAIN_ID}) but connected to chainId ${chainId}.`
      );
    }

    // Authorization check is best-effort — if the contract doesn't expose
    // owner()/authorizedIssuers() or the call reverts, we let the tx attempt
    // proceed and surface any real auth failure from the transaction itself.
    try {
      const owner = await (this.contract as any).owner?.().catch(() => null);
      const isAuthorized = await (this.contract as any).authorizedIssuers?.(this.signer.address).catch(() => true);

      if (owner && owner.toLowerCase() !== this.signer.address.toLowerCase() && !isAuthorized) {
        logger.warn(
          `[Blockchain] Wallet ${this.signer.address} may not be authorized — attempting registration anyway.`
        );
      }
    } catch {
      // Authorization check failed; proceed and let the transaction surface the real error.
      logger.warn('[Blockchain] Could not verify wallet authorization — proceeding with registration attempt.');
    }
  }

  get isEnabled(): boolean {
    return env.BLOCKCHAIN_ENABLED &&
      !!env.BLOCKCHAIN_RPC_URL &&
      !!env.BLOCKCHAIN_PRIVATE_KEY &&
      !!env.BLOCKCHAIN_CONTRACT_ADDRESS;
  }

  async registerCertificate(certificateId: string, certHashHex: string): Promise<RegisterResult> {
    if (!this.init()) {
      return { success: false, error: 'Blockchain not enabled or not configured.' };
    }

    try {
      await this.assertCorrectNetwork();
      logger.info('[Blockchain] Registering certificate', { certificateId });

      const tx = await (this.contract as any).registerCertificate(certificateId, certHashHex);
      const receipt: ethers.TransactionReceipt = await tx.wait(1);
      logger.info('[Blockchain] Certificate registered', {
        certificateId,
        txHash: receipt.hash,
      });

      return {
        success:  true,
        txHash:   receipt.hash,
        network:  this.networkName,
      };
    } catch (err: any) {
      const message = err?.shortMessage ?? err?.message ?? 'Unknown blockchain error';
      logger.error('[Blockchain] registerCertificate failed', { certificateId, error: message });
      return { success: false, error: message };
    }
  }

  async verifyCertificate(certHashHex: string): Promise<VerifyResult> {
    const notFound: VerifyResult = {
      onChain: false, exists: false, revoked: false,
      issuer: '', timestamp: 0, certId: '', hashMatch: false,
    };

    if (!this.init()) {
      return { ...notFound, error: 'Blockchain not enabled or not configured.' };
    }

    try {
      const [exists, revoked, issuer, timestamp, certId]: [boolean, boolean, string, bigint, string] =
        await (this.contract as any).verifyCertificate(certHashHex);

      return {
        onChain:   true,
        exists,
        revoked,
        issuer,
        timestamp: Number(timestamp),
        certId,
        hashMatch: exists,      };
    } catch (err: any) {
      const message = err?.shortMessage ?? err?.message ?? 'Unknown blockchain error';
      logger.error('[Blockchain] verifyCertificate failed', { error: message });
      return { ...notFound, onChain: true, error: message };
    }
  }

  async revokeCertificate(certHashHex: string): Promise<RegisterResult> {
    if (!this.init()) {
      return { success: false, error: 'Blockchain not enabled or not configured.' };
    }

    try {
      await this.assertCorrectNetwork();
      logger.info('[Blockchain] Revoking certificate', { certHashHex: certHashHex.slice(0, 12) + '…' });

      const tx = await (this.contract as any).revokeCertificate(certHashHex);
      const receipt: ethers.TransactionReceipt = await tx.wait(1);

      logger.info('[Blockchain] Certificate revoked on-chain', { txHash: receipt.hash });

      return { success: true, txHash: receipt.hash, network: this.networkName };
    } catch (err: any) {
      const message = err?.shortMessage ?? err?.message ?? 'Unknown blockchain error';
      logger.error('[Blockchain] revokeCertificate failed', { error: message });
      return { success: false, error: message };
    }
  }

  async healthCheck(): Promise<{ connected: boolean; blockNumber?: number; error?: string }> {
    if (!this.init()) return { connected: false, error: 'Not configured.' };
    try {
      const blockNumber = await this.provider!.getBlockNumber();
      return { connected: true, blockNumber };
    } catch (err: any) {
      return { connected: false, error: err?.message };
    }
  }
}

export const blockchainService = new BlockchainService();
