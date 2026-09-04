import { beforeEach, describe, expect, it, vi } from 'vitest';

const providerMock = { getNetwork: vi.fn() };
const contractMock = {
  registerCertificate: vi.fn(),
};

vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(() => providerMock),
    Wallet: vi.fn(() => ({ address: '0x1111111111111111111111111111111111111111' })),
    Contract: vi.fn(() => contractMock),
  },
}));

import { env } from '../config/env';
import { blockchainService } from '../services/blockchain';
import { REGISTRY_ABI } from '../services/blockchain/abi';

describe('BlockchainService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    env.BLOCKCHAIN_ENABLED = true;
    env.BLOCKCHAIN_RPC_URL = 'https://rpc-amoy.polygon.technology';
    env.BLOCKCHAIN_PRIVATE_KEY = '0x' + '11'.repeat(32);
    env.BLOCKCHAIN_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
    env.BLOCKCHAIN_CHAIN_ID = 80002;

    (blockchainService as any).provider = null;
    (blockchainService as any).signer = null;
    (blockchainService as any).contract = null;
    contractMock.registerCertificate.mockReset();
    providerMock.getNetwork.mockReset();
  });

  it('includes the contract owner and issuer accessors needed for authorization checks', () => {
    expect(REGISTRY_ABI.some((item: any) => item.name === 'owner')).toBe(true);
    expect(REGISTRY_ABI.some((item: any) => item.name === 'authorizedIssuers')).toBe(true);
  });

  it('rejects registration when the RPC is not on Polygon Amoy', async () => {
    providerMock.getNetwork.mockResolvedValue({ chainId: 1n });

    const result = await blockchainService.registerCertificate('CC-2026-TEST', 'a'.repeat(64));

    expect(contractMock.registerCertificate).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Polygon Amoy');
    expect(result.error).toContain('80002');
  });
});
