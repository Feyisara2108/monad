export const PROFILE_REGISTRY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;
export const FEED_ENGINE_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' as const;

export const PROFILE_REGISTRY_ABI = [
  {
    "type": "function",
    "name": "createProfile",
    "inputs": [{ "name": "_username", "type": "string", "internalType": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "profiles",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "username", "type": "string", "internalType": "string" },
      { "name": "postCount", "type": "uint256", "internalType": "uint256" },
      { "name": "exists", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ProfileCreated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "username", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  }
] as const

export const FEED_ENGINE_ABI = [
  {
    "type": "function",
    "name": "postMessage",
    "inputs": [{ "name": "_content", "type": "string", "internalType": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "likePost",
    "inputs": [
      { "name": "_author", "type": "address", "internalType": "address" },
      { "name": "_postId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "PostCreated",
    "inputs": [
      { "name": "author", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "postId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "content", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PostLiked",
    "inputs": [
      { "name": "author", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "postId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "liker", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  }
] as const
