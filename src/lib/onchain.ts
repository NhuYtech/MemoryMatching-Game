import SeasonScoreAbi from '@/contracts/abis/SeasonScore.json';
import MatchEscrowAbi from '@/contracts/abis/MatchEscrow.json';
import MemoryMasterAbi from '@/contracts/abis/MemoryMaster.json';
import { getContract, getRpcProvider, getSigner } from './ethers';
import { ENV } from '@/env';

// ============================================================================
// Contract Addresses
// ============================================================================

const ADDR = {
  SEASON_SCORE: ENV.SEASON_SCORE as string | undefined,
  MATCH_ESCROW: ENV.MATCH_ESCROW as string | undefined,
  MEMORY_MASTER: ENV.MEMORY_MASTER as string | undefined,
};

// ============================================================================
// Error Types
// ============================================================================

interface ContractError extends Error {
  code?: string;
  reason?: string;
}

function isContractError(error: unknown): error is ContractError {
  return error instanceof Error;
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateContractAddress(address: string | undefined, name: string): string {
  if (!address || address.trim() === '') {
    throw new Error(`Missing contract address: ${name}. Please check your environment variables.`);
  }
  return address;
}

// ============================================================================
// Season Score Contract
// ============================================================================

export async function submitSeasonScore(score: number) {
  const address = validateContractAddress(ADDR.SEASON_SCORE, 'SEASON_SCORE');

  const signer = await getSigner();
  if (!signer) {
    throw new Error('Wallet not connected. Please connect your MetaMask wallet.');
  }

  const contract = getContract(address, SeasonScoreAbi, signer);

  try {
    const tx = await (contract as unknown as { submit: (score: bigint) => Promise<{ wait: () => Promise<unknown> }> }).submit(BigInt(score));
    return tx.wait();
  } catch (error: unknown) {
    if (isContractError(error)) {
      // User rejected transaction
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.reason || error.message);
    }
    throw error;
  }
}

export async function fetchRecentSeasonScores(fromBlock?: number, toBlock?: number) {
  const address = validateContractAddress(ADDR.SEASON_SCORE, 'SEASON_SCORE');

  const provider = getRpcProvider();
  if (!provider) {
    throw new Error('Missing RPC_URL. Please check your environment variables.');
  }

  const contract = getContract(address, SeasonScoreAbi, provider);
  const current = await provider.getBlockNumber();
  const from = fromBlock ?? Math.max(0, current - 20_000);
  const to = toBlock ?? current;

  const filter = (contract as unknown as { filters: { ScoreSubmitted: (p: null, s: null, se: null) => unknown } }).filters.ScoreSubmitted(null, null, null);
  const logs = await (contract as unknown as { queryFilter: (f: unknown, from: number, to: number) => Promise<Array<{ args: { player: string; score: bigint; season: bigint }; blockNumber: number }>> }).queryFilter(filter, from, to);

  return logs.map((l) => ({
    player: l.args.player as string,
    score: Number(l.args.score),
    season: Number(l.args.season),
    blockNumber: l.blockNumber as number,
  }));
}

// ============================================================================
// Match Escrow Contract (PvP Wagers)
// ============================================================================

export async function createWager(wagerWei: bigint) {
  const address = validateContractAddress(ADDR.MATCH_ESCROW, 'MATCH_ESCROW');

  const signer = await getSigner();
  if (!signer) {
    throw new Error('Wallet not connected');
  }

  const contract = getContract(address, MatchEscrowAbi, signer);

  try {
    const tx = await (contract as unknown as { createMatch: (amount: bigint) => Promise<{ wait: () => Promise<{ logs?: Array<{ fragment?: { name: string } | undefined; args?: { matchId: string } | undefined }> | undefined }> }> }).createMatch(wagerWei);
    const receipt = await tx.wait();
    const ev = receipt.logs?.find((l) => l.fragment?.name === 'MatchCreated');
    return ev?.args?.matchId as string | undefined;
  } catch (error: unknown) {
    if (isContractError(error)) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.reason || error.message);
    }
    throw error;
  }
}

export async function joinWager(matchId: string) {
  const address = validateContractAddress(ADDR.MATCH_ESCROW, 'MATCH_ESCROW');

  const signer = await getSigner();
  if (!signer) {
    throw new Error('Wallet not connected');
  }

  const contract = getContract(address, MatchEscrowAbi, signer);

  try {
    const tx = await (contract as unknown as { joinMatch: (id: string) => Promise<{ wait: () => Promise<unknown> }> }).joinMatch(matchId);
    return tx.wait();
  } catch (error: unknown) {
    if (isContractError(error)) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.reason || error.message);
    }
    throw error;
  }
}

export async function resolveWager(matchId: string, winnerAddress: string) {
  const address = validateContractAddress(ADDR.MATCH_ESCROW, 'MATCH_ESCROW');

  const signer = await getSigner();
  if (!signer) {
    throw new Error('Wallet not connected');
  }

  const contract = getContract(address, MatchEscrowAbi, signer);

  try {
    const tx = await (contract as unknown as { resolve: (id: string, winner: string) => Promise<{ wait: () => Promise<unknown> }> }).resolve(matchId, winnerAddress);
    return tx.wait();
  } catch (error: unknown) {
    if (isContractError(error)) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.reason || error.message);
    }
    throw error;
  }
}

// ============================================================================
// Memory Master NFT Contract
// ============================================================================

export async function claimMasterNft() {
  const address = validateContractAddress(ADDR.MEMORY_MASTER, 'MEMORY_MASTER');

  const signer = await getSigner();
  if (!signer) {
    throw new Error('Wallet not connected');
  }

  const contract = getContract(address, MemoryMasterAbi, signer);

  try {
    const tx = await (contract as unknown as { claimMaster: () => Promise<{ wait: () => Promise<unknown> }> }).claimMaster();
    return tx.wait();
  } catch (error: unknown) {
    if (isContractError(error)) {
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }
      throw new Error(error.reason || error.message);
    }
    throw error;
  }
}

