import { NextRequest } from 'next/server';
import { keccak_256 } from '@noble/hashes/sha3';

export async function POST(req: NextRequest) {
  try {
    const { roomId, nonce } = await req.json();
    if (!roomId || !nonce) {
      return new Response(JSON.stringify({ error: 'roomId and nonce are required' }), { status: 400 });
    }
    const enc = new TextEncoder();
    const hash = keccak_256(enc.encode(`${roomId}:${nonce}`));
    const seed = Math.abs(((hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3]) | 0);
    return new Response(JSON.stringify({ seed }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}


