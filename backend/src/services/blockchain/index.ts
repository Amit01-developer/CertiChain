import { ethers } from 'ethers';
import { env }    from '../../config/env';
import { logger } from '../../utils/logger';
import { REGISTRY_ABI } from './abi';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterResult {
  success:     boolean;
  txHash?:     string;
  network?:    string;
  error?:      string;
}

export interface VerifyResult {
  onChain:   boolean;   // found on chain
  exists:    boolean;
  revoked:   boolean;
  issuer:    string;
  timestamp: number;   // unix seconds
  certId:    string;
  hashMatch: boolean;  // certHashHex matches what we passed in
  error?:    string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class BlockchainService {
  private provider:  ethers.JsonRpcProvider | null = null;
  private signer:    ethers.Wallet            | null = null;
  private contract:  ethers.Contract          | null = null;
  private networkName = 'Polygon Amoy';

  /** Lazy-initialise provider/signer/contract on first use. */
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

  /** Whether blockchain integration is active and properly configured. */
  get isEnabled(): boolean {
    return env.BLOCKCHAIN_ENABLED &&
      !!env.BLOCKCHAIN_RPC_URL &&
      !!env.BLOCKCHAIN_PRIVATE_KEY &&
      !!env.BLOCKCHAIN_CONTRACT_ADDRESS;
  }

  /**
   * Register a certificate hash on-chain.
   * Never throws — returns success/failure in the result object.
   */
  async registerCertificate(certificateId: string, certHashHex: string): Promise<RegisterResult> {
    if (!this.init()) {
      return { success: false, error: 'Blockchain not enabled or not configured.' };
    }

    try {
      logger.info('[Blockchain] Registering certificate', { certificateId });

      const tx = await (this.contract as any).registerCertificate(certificateId, certHashHex);
      const receipt: ethers.TransactionReceipt = await tx.wait(1); // wait 1 confirmation

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

  /**
   * Verify a certificate hash against the on-chain registry.
   * Never throws — returns a structured result.
   */
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
        hashMatch: exists, // if it exists, the hash matched (we queried by hash)
      };
    } catch (err: any) {
      const message = err?.shortMessage ?? err?.message ?? 'Unknown blockchain error';
      logger.error('[Blockchain] verifyCertificate failed', { error: message });
      return { ...notFound, onChain: true, error: message };
    }
  }

  /**
   * Revoke a certificate on-chain.
   * Never throws — returns success/failure.
   */
  async revokeCertificate(certHashHex: string): Promise<RegisterResult> {
    if (!this.init()) {
      return { success: false, error: 'Blockchain not enabled or not configured.' };
    }

    try {
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

  /** Ping the RPC to check connectivity. */
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
