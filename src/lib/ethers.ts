import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import { ENV } from '@/env';

export function getRpcProvider() {
  const rpcUrl = ENV.RPC_URL as string | undefined;
  if (!rpcUrl) return null;
  return new JsonRpcProvider(rpcUrl);
}

export async function getBrowserProvider(): Promise<BrowserProvider | null> {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  const provider = new BrowserProvider(eth);
  await provider.send('eth_requestAccounts', []);
  return provider;
}

export async function getSigner() {
  const provider = await getBrowserProvider();
  if (!provider) return null;
  return provider.getSigner();
}

export function getContract<T = any>(address: string, abi: any, providerOrSigner: any) {
  return new Contract(address, abi, providerOrSigner) as unknown as T;
}


