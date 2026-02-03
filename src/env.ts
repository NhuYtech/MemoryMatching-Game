// Type-safe environment variable access
interface ProcessEnv {
  [key: string]: string | undefined;
}

interface ImportMetaEnv {
  [key: string]: string | undefined;
}

export function getEnv(key: string): string | undefined {
  // Prefer Next.js public env
  if (typeof process !== 'undefined' && process.env && (process.env as ProcessEnv)[key] !== undefined) {
    return (process.env as ProcessEnv)[key];
  }
  // Fallback for Vite style
  const meta: ImportMetaEnv | undefined = (typeof import.meta !== 'undefined' ? (import.meta as { env?: ImportMetaEnv }).env : undefined);
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

