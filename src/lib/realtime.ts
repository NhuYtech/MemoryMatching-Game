import Pusher, { Channel } from 'pusher-js';
import { ENV } from '@/env';

// Generic event payload type - can be extended per use case
type EventPayload = Record<string, unknown>;

export interface RealtimeClient {
  connect: () => void;
  subscribe: <T = Record<string, unknown>>(
    channelName: string,
    handlers: Record<string, (data: T) => void>
  ) => Channel | null;
  trigger: (channelName: string, event: string, data: Record<string, unknown>) => void;
}

export function createRealtimeClient(): RealtimeClient | null {
  const key = ENV.PUSHER_KEY as string | undefined;
  const cluster = ENV.PUSHER_CLUSTER as string | undefined;
  if (!key || !cluster) {
    // No realtime configured
    return null;
  }

  const pusher = new Pusher(key, { cluster });

  return {
    connect: () => {
      // Pusher auto-connects on subscribe; expose for symmetry
    },
    subscribe: (channelName, handlers) => {
      const ch = pusher.subscribe(channelName);
      Object.entries(handlers).forEach(([event, handler]) => {
        // Pusher's bind expects (event: string, callback: Function)
        ch.bind(event, handler as (data: unknown) => void);
      });
      return ch;
    },
    trigger: (_channelName, _event, _data) => {
      // Client-side trigger requires private/presence channels and auth.
      // In this skeleton, we assume a server exists to trigger events.
      // Leave unimplemented to avoid confusion.
      console.warn('Realtime trigger is not implemented on client. Use your server to publish events.');
    },
  };
}

