import type { Address } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

export const PROFILE_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS || ZERO_ADDRESS) as Address
export const FEED_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_FEED_ENGINE_ADDRESS || ZERO_ADDRESS) as Address
export const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'

export const isContractsConfigured =
  PROFILE_REGISTRY_ADDRESS !== ZERO_ADDRESS && FEED_ENGINE_ADDRESS !== ZERO_ADDRESS

export const PROFILE_REGISTRY_ABI = [
  {
    "type": "function",
    "name": "createProfile",
    "inputs": [
      { "name": "_username", "type": "string", "internalType": "string" },
      { "name": "_bio", "type": "string", "internalType": "string" },
      { "name": "_avatarURI", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateProfile",
    "inputs": [
      { "name": "_username", "type": "string", "internalType": "string" },
      { "name": "_bio", "type": "string", "internalType": "string" },
      { "name": "_avatarURI", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "profiles",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "username", "type": "string", "internalType": "string" },
      { "name": "bio", "type": "string", "internalType": "string" },
      { "name": "avatarURI", "type": "string", "internalType": "string" },
      { "name": "postCount", "type": "uint256", "internalType": "uint256" },
      { "name": "followerCount", "type": "uint256", "internalType": "uint256" },
      { "name": "followingCount", "type": "uint256", "internalType": "uint256" },
      { "name": "exists", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isFollowing",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "follow",
    "inputs": [{ "name": "_user", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unfollow",
    "inputs": [{ "name": "_user", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ProfileCreated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "username", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "bio", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "avatarURI", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProfileUpdated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "username", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "bio", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "avatarURI", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Followed",
    "inputs": [
      { "name": "follower", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "followee", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Unfollowed",
    "inputs": [
      { "name": "follower", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "followee", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  }
] as const

export const FEED_ENGINE_ABI = [
  {
    "type": "function",
    "name": "createPost",
    "inputs": [
      { "name": "_content", "type": "string", "internalType": "string" },
      { "name": "_mediaURI", "type": "string", "internalType": "string" },
      { "name": "_mediaType", "type": "uint8", "internalType": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "toggleLike",
    "inputs": [{ "name": "_postId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addComment",
    "inputs": [
      { "name": "_postId", "type": "uint256", "internalType": "uint256" },
      { "name": "_content", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalPosts",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "posts",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "id", "type": "uint256", "internalType": "uint256" },
      { "name": "author", "type": "address", "internalType": "address" },
      { "name": "content", "type": "string", "internalType": "string" },
      { "name": "mediaURI", "type": "string", "internalType": "string" },
      { "name": "mediaType", "type": "uint8", "internalType": "uint8" },
      { "name": "likeCount", "type": "uint256", "internalType": "uint256" },
      { "name": "commentCount", "type": "uint256", "internalType": "uint256" },
      { "name": "authorPostCount", "type": "uint256", "internalType": "uint256" },
      { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
      { "name": "exists", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasLiked",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecentPostIds",
    "inputs": [
      { "name": "_offset", "type": "uint256", "internalType": "uint256" },
      { "name": "_limit", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPostIdsByAuthor",
    "inputs": [
      { "name": "_author", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getComments",
    "inputs": [
      { "name": "_postId", "type": "uint256", "internalType": "uint256" },
      { "name": "_offset", "type": "uint256", "internalType": "uint256" },
      { "name": "_limit", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct FeedEngine.Comment[]",
        "components": [
          { "name": "author", "type": "address", "internalType": "address" },
          { "name": "content", "type": "string", "internalType": "string" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PostCreated",
    "inputs": [
      { "name": "postId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "author", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "content", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "mediaURI", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "mediaType", "type": "uint8", "indexed": false, "internalType": "uint8" },
      { "name": "createdAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PostLikeToggled",
    "inputs": [
      { "name": "postId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "author", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "liked", "type": "bool", "indexed": false, "internalType": "bool" },
      { "name": "likeCount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CommentCreated",
    "inputs": [
      { "name": "postId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "commentId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "author", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "content", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "createdAt", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const
