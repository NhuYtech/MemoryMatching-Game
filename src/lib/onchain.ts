import SeasonScoreAbi from '@/contracts/abis/SeasonScore.json';
import MatchEscrowAbi from '@/contracts/abis/MatchEscrow.json';
import MemoryMasterAbi from '@/contracts/abis/MemoryMaster.json';
import { getContract, getRpcProvider, getSigner } from './ethers';
import { ENV } from '@/env';

const ADDR = {
  SEASON_SCORE: ENV.SEASON_SCORE as string | undefined,
  MATCH_ESCROW: ENV.MATCH_ESCROW as string | undefined,
  MEMORY_MASTER: ENV.MEMORY_MASTER as string | undefined,
};

export async function submitSeasonScore(score: number) {
  if (!ADDR.SEASON_SCORE) throw new Error('Missing VITE_SEASON_SCORE');
  const signer = await getSigner();
  if (!signer) throw new Error('Wallet not connected');
  const contract = getContract(ADDR.SEASON_SCORE, SeasonScoreAbi, signer);
  const tx = await (contract as any).submit(BigInt(score));
  return tx.wait();
}

export async function fetchRecentSeasonScores(fromBlock?: number, toBlock?: number) {
  if (!ADDR.SEASON_SCORE) throw new Error('Missing VITE_SEASON_SCORE');
  const provider = getRpcProvider();
  if (!provider) throw new Error('Missing VITE_RPC_URL');
  const contract = getContract(ADDR.SEASON_SCORE, SeasonScoreAbi, provider);
  const current = await provider.getBlockNumber();
  const from = fromBlock ?? Math.max(0, current - 20_000);
  const to = toBlock ?? current;
  const filter = (contract as any).filters.ScoreSubmitted(null, null, null);
  const logs = await (contract as any).queryFilter(filter, from, to);
  return logs.map((l: any) => ({
    player: l.args.player as string,
    score: Number(l.args.score),
    season: Number(l.args.season),
    blockNumber: l.blockNumber as number,
  }));
}

export async function createWager(amountWei: bigint) {
  if (!ADDR.MATCH_ESCROW) throw new Error('Missing VITE_MATCH_ESCROW');
  const signer = await getSigner();
  if (!signer) throw new Error('Wallet not connected');
  const contract = getContract(ADDR.MATCH_ESCROW, MatchEscrowAbi, signer);
  const tx = await (contract as any).createMatch(amountWei);
  const receipt = await tx.wait();
  const ev = receipt.logs?.find((l: any) => l.fragment?.name === 'MatchCreated');
  return ev?.args?.matchId as string | undefined;
}

export async function joinWager(matchId: string) {
  if (!ADDR.MATCH_ESCROW) throw new Error('Missing VITE_MATCH_ESCROW');
  const signer = await getSigner();
  if (!signer) throw new Error('Wallet not connected');
  const contract = getContract(ADDR.MATCH_ESCROW, MatchEscrowAbi, signer);
  const tx = await (contract as any).joinMatch(matchId);
  return tx.wait();
}

export async function resolveWager(matchId: string, winner: string) {
  if (!ADDR.MATCH_ESCROW) throw new Error('Missing VITE_MATCH_ESCROW');
  const signer = await getSigner();
  if (!signer) throw new Error('Wallet not connected');
  const contract = getContract(ADDR.MATCH_ESCROW, MatchEscrowAbi, signer);
  const tx = await (contract as any).resolve(matchId, winner);
  return tx.wait();
}

export async function claimMasterNft() {
  if (!ADDR.MEMORY_MASTER) throw new Error('Missing VITE_MEMORY_MASTER');
  const signer = await getSigner();
  if (!signer) throw new Error('Wallet not connected');
  const contract = getContract(ADDR.MEMORY_MASTER, MemoryMasterAbi, signer);
  const tx = await (contract as any).claimMaster();
  return tx.wait();
}


