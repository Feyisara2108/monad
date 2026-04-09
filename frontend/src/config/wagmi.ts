import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const monadLocal = {
    id: 31337,
    name: 'Monad Local/Anvil',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
    },
}

export const monadTestnet = {
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://testnet-rpc.monad.xyz/'] },
    },
}

export const config = getDefaultConfig({
  appName: 'Pulse',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [monadTestnet, monadLocal],
  transports: {
    [monadTestnet.id]: http(),
    [monadLocal.id]: http(),
  },
})
