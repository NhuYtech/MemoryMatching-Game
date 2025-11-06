import { keccak_256 } from '@noble/hashes/sha3';

export function keccakHex(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hash = keccak_256(bytes);
  return '0x' + Array.from(hash).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function deriveSeed(roomId: string, nonce: string): number {
  const h = keccak_256(new TextEncoder().encode(`${roomId}:${nonce}`));
  // take first 4 bytes for 32-bit seed
  const seed = (h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3];
  return Math.abs(seed);
}

export function commitAction(payload: string, salt: string): string {
  return keccakHex(`${payload}:${salt}`);
}

export function verifyCommit(commit: string, payload: string, salt: string): boolean {
  return commit.toLowerCase() === commitAction(payload, salt).toLowerCase();
}


