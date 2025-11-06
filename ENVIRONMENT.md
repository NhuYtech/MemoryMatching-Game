Environment setup

Create a .env.local (Next.js) in the project root with these keys:

RPC and realtime
- NEXT_PUBLIC_RPC_URL=
- NEXT_PUBLIC_PUSHER_KEY=
- NEXT_PUBLIC_PUSHER_CLUSTER=

Contracts
- NEXT_PUBLIC_SEASON_SCORE=
- NEXT_PUBLIC_MATCH_ESCROW=
- NEXT_PUBLIC_MEMORY_MASTER=

Notes
- These are public variables; do not include secrets here.
- If you previously used Vite variables (VITE_*), the app now supports both, but NEXT_PUBLIC_* is preferred.


