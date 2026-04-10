# Pulse frontend

This is the Instagram-style frontend for Pulse.

## Required env

Copy `frontend/.env.example` to `frontend/.env.local` and fill in:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_FEED_ENGINE_ADDRESS=0x...
PINATA_JWT=your_pinata_jwt
```

## Run

```bash
npm install
npm run dev
```

## What the UI supports

- RainbowKit wallet connection
- Profile creation and editing
- IPFS media uploads through Pinata
- Media posts
- Likes
- Comments
- Follow and unfollow
- Feed and creator side panels
