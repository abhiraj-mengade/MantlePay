// Contract addresses - Deployed on Mantle Sepolia Testnet
export const CONTRACT_ADDRESSES = {
  // Main CascadeProtocol contract address
  CASCADE_PROTOCOL: "0x44994F1f72129deC08457632E7f76224c879e59e" as `0x${string}`,
  
  // ReceiptNFT contract address
  RECEIPT_NFT: "0x28226Fe29970E41e54CE46fBa973933F0721E2de" as `0x${string}`,
};

// ReceiptNFT ABI
export const RECEIPT_NFT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ name: "to", type: "address" }],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "nextId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// TrancheToken ABI
export const TRANCHE_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// CascadeProtocol ABI
export const CASCADE_PROTOCOL_ABI = [
  // Constructor
  {
    inputs: [{ name: "_receiptNft", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: false, name: "targetRaise", type: "uint256" },
    ],
    name: "PoolCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: false, name: "tranche", type: "string" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "Invested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "MerchantFunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "RepaymentReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "poolId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "Claimed",
    type: "event",
  },
  // View functions
  {
    inputs: [],
    name: "poolCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "receiptNft",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "poolId", type: "uint256" }],
    name: "pools",
    outputs: [
      { name: "merchant", type: "address" },
      { name: "receivableValue", type: "uint256" },
      { name: "advanceAmount", type: "uint256" },
      { name: "seniorToken", type: "address" },
      { name: "juniorToken", type: "address" },
      { name: "seniorFaceValue", type: "uint256" },
      { name: "seniorTargetRaise", type: "uint256" },
      { name: "juniorFaceValue", type: "uint256" },
      { name: "juniorTargetRaise", type: "uint256" },
      { name: "seniorRaised", type: "uint256" },
      { name: "juniorRaised", type: "uint256" },
      { name: "totalRepaid", type: "uint256" },
      { name: "isFunded", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_receivableValue", type: "uint256" },
      { name: "_investorReturn", type: "uint256" },
      { name: "_seniorDiscBPS", type: "uint256" },
      { name: "_juniorDiscBPS", type: "uint256" },
    ],
    name: "createPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_poolId", type: "uint256" }],
    name: "investSenior",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "_poolId", type: "uint256" }],
    name: "investJunior",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "_poolId", type: "uint256" }],
    name: "repay",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "_poolId", type: "uint256" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_poolId", type: "uint256" }],
    name: "claimMerchantResidual",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Receive function
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

// Helper to check if contracts are deployed
export function areContractsDeployed(): boolean {
  return (
    CONTRACT_ADDRESSES.CASCADE_PROTOCOL !== "0x0000000000000000000000000000000000000000" &&
    CONTRACT_ADDRESSES.RECEIPT_NFT !== "0x0000000000000000000000000000000000000000"
  );
}

// Helper to format MNT amount from wei
export function formatMNT(weiAmount: bigint): string {
  const mnt = Number(weiAmount) / 1e18;
  return mnt.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// Helper to parse MNT to wei
export function parseMNT(mntAmount: string): bigint {
  const mnt = parseFloat(mntAmount);
  return BigInt(Math.floor(mnt * 1e18));
}
