# Pulse ⚡: Instant On-Chain Social on Monad

## Overview

Pulse is a decentralized microblogging feed designed to deliver a real-time Web3 social experience natively on Monad. By building specifically on Monad's parallel architecture, Pulse completely eliminates the legacy ~12 second confirmation bottlenecks inherent on standard EVM networks. On Pulse, users post, like, and follow instantly, providing a seamless Web2-like social experience but with fully decentralized, censorship-resistant on-chain persistence.

## Why Monad?

### High-Throughput & Low-Latency
Monad provides a parallel EVM architecture. Wait times feel nearly non-existent for modern decentralized applications that want zero-friction engagement.

### Parallel EVM Execution
Transactions are non-conflicting by design. Pulse groups user states in parallel mappings. When "User A" makes a post and "User B" likes a post, Monad's engine speculatively executes these in parallel across distinct CPU cores. This avoids the bottleneck of a unified state-lock, meaning higher TPS practically scales linearly for our application design.

### Sub-Second Consensus & Optimistic finality
With ~400ms block generation and roughly ~800ms full finality enabled by MonadBFT, Pulse utilizes optimistic UI rendering securely. Because Monad practically finalizes within a block, updating the UI client-side instantly feels extremely secure and eliminates any "buffering" feeling.

## Stack Requirements

### Frontend 💻
- **Next.js (App Router):** The bedrock of our highly optimized frontend React application, allowing fast navigation and optimized asset loading.
- **Tailwind CSS:** Utilizing a sleek Dark Mode styling specifically modeled to replicate familiar and modern Web2 microblogging experiences with slick CSS micro-animations.
- **Wagmi & Viem:** Connects standard MetaMask/Rabby wallets quickly to Monad testnet and handles lightning-fast contract event monitoring (crucial for live-feed).

### Contracts & Backend ⚙️
- **Solidity:** Smart contracts utilizing independent mapping strategies for maximum execution parallelism.
- **Foundry:** Compiles, tests, and deploys smart contracts to the chain efficiently.

## Architectural Design

### 1. Smart Contracts
The backend is composed of two primary independent contracts designed specifically to maximize Monad's thread isolation:
1. `ProfileRegistry.sol`: Registers decentralized handles and tracks the user's specific global follow graph (`mapping(address => mapping(address => bool)) isFollowing`).
2. `FeedEngine.sol`: Stores user interactions explicitly per author utilizing `mapping(address => mapping(uint256 => Post)) posts`. Since each user's state is independently isolated under their primary address, multiple users submitting posts at identical moments resolve correctly without blocking parallel queues.

### 2. Event-Driven Real-Time Feeds
Smart contracts are entirely stateless regarding search; they do not utilize heavy array iteration internally. Instead, pure EVM Events (`PostCreated`, `PostLiked`) are emitted heavily. The frontend watches these events efficiently utilizing Viem. No separate backend indexer is strictly required for the MVP due to this efficient live indexing.

## Building Instructions & Development

**(If you choose to run locally after setup):**

1. Compile and Test Smart Contracts
```bash
cd contracts
forge install
forge test
```
2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
3. Open `http://localhost:3000` to interact.

---

*Let's build a faster Web3 social reality.*
