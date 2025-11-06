import Pusher, { Channel } from 'pusher-js';
import { ENV } from '@/env';

type EventPayload = any;

export interface RealtimeClient {
  connect: () => void;
  subscribe: (channelName: string, handlers: Record<string, (data: EventPayload) => void>) => Channel | null;
  trigger: (channelName: string, event: string, data: EventPayload) => void;
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
        ch.bind(event, handler as any);
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


