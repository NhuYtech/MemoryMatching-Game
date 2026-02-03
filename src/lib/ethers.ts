import { BrowserProvider, Contract, JsonRpcProvider, Signer, ContractRunner, InterfaceAbi } from 'ethers';
import { ENV } from '@/env';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      selectedAddress?: string | null;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function getRpcProvider() {
  const rpcUrl = ENV.RPC_URL as string | undefined;
  if (!rpcUrl) return null;
  return new JsonRpcProvider(rpcUrl);
}

export async function getBrowserProvider(): Promise<BrowserProvider | null> {
  if (typeof window === 'undefined') return null;
  const eth = window.ethereum;
  if (!eth) return null;
  const provider = new BrowserProvider(eth);
  await provider.send('eth_requestAccounts', []);
  return provider;
}

export async function getSigner(): Promise<Signer | null> {
  const provider = await getBrowserProvider();
  if (!provider) return null;
  return provider.getSigner();
}

export function getContract<T = Contract>(
  address: string,
  abi: InterfaceAbi,
  providerOrSigner: ContractRunner
): T {
  return new Contract(address, abi, providerOrSigner) as unknown as T;
}

