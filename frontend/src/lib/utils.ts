import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PINATA_GATEWAY } from '@/config/contracts'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address?: string) {
  if (!address) return 'Unknown'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function resolveIpfsUrl(uri?: string) {
  if (!uri) return ''
  if (uri.startsWith('ipfs://')) {
    return `${PINATA_GATEWAY}${uri.replace('ipfs://', '')}`
  }
  return uri
}

export function getInitials(name?: string, fallback?: string) {
  const value = (name || fallback || 'P').trim()
  return value.slice(0, 2).toUpperCase()
}

export function extractTags(posts: Array<{ content: string }>) {
  const counts = new Map<string, number>()

  posts.forEach((post) => {
    const matches = post.content.match(/#[a-z0-9_]+/gi) || []
    matches.forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
}

export function includesText(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase())
}
