export function getEnv(key: string): string | undefined {
  // Prefer Next.js public env
  if (typeof process !== 'undefined' && (process as any).env && (process as any).env[key] !== undefined) {
    return (process as any).env[key];
  }
  // Fallback for Vite style
  const meta: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined);
  return meta ? meta[key] : undefined;
}

export const ENV = {
  RPC_URL: getEnv('NEXT_PUBLIC_RPC_URL') || getEnv('VITE_RPC_URL'),
  PUSHER_KEY: getEnv('NEXT_PUBLIC_PUSHER_KEY') || getEnv('VITE_PUSHER_KEY'),
  PUSHER_CLUSTER: getEnv('NEXT_PUBLIC_PUSHER_CLUSTER') || getEnv('VITE_PUSHER_CLUSTER'),
  SEASON_SCORE: getEnv('NEXT_PUBLIC_SEASON_SCORE') || getEnv('VITE_SEASON_SCORE'),
  MATCH_ESCROW: getEnv('NEXT_PUBLIC_MATCH_ESCROW') || getEnv('VITE_MATCH_ESCROW'),
  MEMORY_MASTER: getEnv('NEXT_PUBLIC_MEMORY_MASTER') || getEnv('VITE_MEMORY_MASTER'),
};


