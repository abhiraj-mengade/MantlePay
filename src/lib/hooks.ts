"use client";

import { useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/app/client";
import { mantleTestnet } from "./chain";
import {
  CONTRACT_ADDRESSES,
  CASCADE_PROTOCOL_ABI,
  RECEIPT_NFT_ABI,
  TRANCHE_TOKEN_ABI,
  areContractsDeployed,
  formatMNT,
} from "./contracts";

// Get contract instances
export function getCascadeProtocolContract() {
  return getContract({
    client,
    chain: mantleTestnet,
    address: CONTRACT_ADDRESSES.CASCADE_PROTOCOL,
    abi: CASCADE_PROTOCOL_ABI,
  });
}

export function getReceiptNFTContract() {
  return getContract({
    client,
    chain: mantleTestnet,
    address: CONTRACT_ADDRESSES.RECEIPT_NFT,
    abi: RECEIPT_NFT_ABI,
  });
}

export function getTrancheTokenContract(address: string) {
  return getContract({
    client,
    chain: mantleTestnet,
    address: address as `0x${string}`,
    abi: TRANCHE_TOKEN_ABI,
  });
}

// Hook to get pool count
export function usePoolCount() {
  const contract = getCascadeProtocolContract();
  
  return useReadContract({
    contract,
    method: "poolCount" as const,
    params: [],
  });
}

// Hook to get pool data
export function usePool(poolId: number) {
  const contract = getCascadeProtocolContract();
  
  return useReadContract({
    contract,
    method: "pools" as const,
    params: [BigInt(poolId)],
  });
}

// Hook to get receipt NFT next ID
export function useNextReceiptId() {
  const contract = getReceiptNFTContract();
  
  return useReadContract({
    contract,
    method: "nextId" as const,
    params: [],
  });
}

// Hook to get tranche token balance
export function useTrancheBalance(tokenAddress: string, account: string) {
  const contract = getTrancheTokenContract(tokenAddress);
  
  return useReadContract({
    contract,
    method: "balanceOf" as const,
    params: [account as `0x${string}`],
  });
}

// Hook to get NFT approval status
export function useNFTApproval(tokenId: bigint) {
  const contract = getReceiptNFTContract();
  
  return useReadContract({
    contract,
    method: "getApproved" as const,
    params: [tokenId],
  });
}

// Hook to get NFT owner
export function useNFTOwner(tokenId: bigint) {
  const contract = getReceiptNFTContract();
  
  return useReadContract({
    contract,
    method: "ownerOf" as const,
    params: [tokenId],
  });
}

// Pool data type
export type PoolData = {
  id: number;
  merchant: string;
  receivableValue: bigint;
  advanceAmount: bigint;
  seniorToken: string;
  juniorToken: string;
  seniorFaceValue: bigint;
  seniorTargetRaise: bigint;
  juniorFaceValue: bigint;
  juniorTargetRaise: bigint;
  seniorRaised: bigint;
  juniorRaised: bigint;
  totalRepaid: bigint;
  isFunded: boolean;
};

// Helper to parse pool data from contract response
export function parsePoolData(id: number, data: readonly [
  string, bigint, bigint, string, string, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean
]): PoolData {
  return {
    id,
    merchant: data[0],
    receivableValue: data[1],
    advanceAmount: data[2],
    seniorToken: data[3],
    juniorToken: data[4],
    seniorFaceValue: data[5],
    seniorTargetRaise: data[6],
    juniorFaceValue: data[7],
    juniorTargetRaise: data[8],
    seniorRaised: data[9],
    juniorRaised: data[10],
    totalRepaid: data[11],
    isFunded: data[12],
  };
}

// Calculate pool display data
export function calculatePoolStats(pool: PoolData) {
  const totalTarget = pool.seniorTargetRaise + pool.juniorTargetRaise;
  const totalRaised = pool.seniorRaised + pool.juniorRaised;

  // Economic split of advance amount A between Senior (75%) and Junior (25%)
  const seniorAdvancePortion = (pool.advanceAmount * 75n) / 100n;
  const juniorAdvancePortion = (pool.advanceAmount * 25n) / 100n;

  // Overall funding progress measured against advance amount A
  const fundingProgress = pool.advanceAmount > 0n
    ? Number((totalRaised * 10000n) / pool.advanceAmount) / 100
    : 0;
  
  // Tranche progress measured against 75% and 25% of A respectively
  const seniorProgress = seniorAdvancePortion > 0n
    ? Number((pool.seniorRaised * 10000n) / seniorAdvancePortion) / 100
    : 0;
  const juniorProgress = juniorAdvancePortion > 0n
    ? Number((pool.juniorRaised * 10000n) / juniorAdvancePortion) / 100
    : 0;

  // ROI calculation: ROI = discount / (1 - discount)
  // where discount = (faceValue - targetRaise) / faceValue
  // This simplifies to: ROI = (faceValue - targetRaise) / targetRaise
  // But we need to use the formula: ROI = discount / (1 - discount)
  // discount = (faceValue - targetRaise) / faceValue
  const seniorDiscount = pool.seniorFaceValue > 0n
    ? Number((pool.seniorFaceValue - pool.seniorTargetRaise) * 10000n / pool.seniorFaceValue) / 10000
    : 0;
  const juniorDiscount = pool.juniorFaceValue > 0n
    ? Number((pool.juniorFaceValue - pool.juniorTargetRaise) * 10000n / pool.juniorFaceValue) / 10000
    : 0;
  
  const seniorROI = seniorDiscount > 0 && seniorDiscount < 1
    ? (seniorDiscount / (1 - seniorDiscount)) * 100
    : 0;
  const juniorROI = juniorDiscount > 0 && juniorDiscount < 1
    ? (juniorDiscount / (1 - juniorDiscount)) * 100
    : 0;

  // Total receive C = seniorFaceValue + juniorFaceValue
  const totalReceive = pool.seniorFaceValue + pool.juniorFaceValue;

  return {
    totalValue: formatMNT(pool.receivableValue),
    advanceAmount: formatMNT(pool.advanceAmount),
    seniorAPY: seniorROI, // kept key name for backwards compatibility; interpreted as ROI in UI
    juniorAPY: juniorROI,
    fundingProgress,
    seniorProgress,
    juniorProgress,
    seniorRaised: formatMNT(pool.seniorRaised),
    seniorTarget: formatMNT(seniorAdvancePortion),
    juniorRaised: formatMNT(pool.juniorRaised),
    juniorTarget: formatMNT(juniorAdvancePortion),
    totalRaised: formatMNT(totalRaised),
    totalTarget: formatMNT(totalTarget),
    totalReceive: formatMNT(totalReceive),
    isFunded: pool.isFunded,
  };
}

// Transaction hooks
export function useInvestSenior() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getCascadeProtocolContract();
  
  const investSenior = async (poolId: number, amount: bigint) => {
    const transaction = prepareContractCall({
      contract,
      method: "investSenior" as const,
      params: [BigInt(poolId)],
      value: amount,
    });
    return mutateAsync(transaction);
  };
  
  return { investSenior, isPending, error };
}

export function useInvestJunior() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getCascadeProtocolContract();
  
  const investJunior = async (poolId: number, amount: bigint) => {
    const transaction = prepareContractCall({
      contract,
      method: "investJunior" as const,
      params: [BigInt(poolId)],
      value: amount,
    });
    return mutateAsync(transaction);
  };
  
  return { investJunior, isPending, error };
}

export function useRepay() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getCascadeProtocolContract();
  
  const repay = async (poolId: number, amount: bigint) => {
    const transaction = prepareContractCall({
      contract,
      method: "repay" as const,
      params: [BigInt(poolId)],
      value: amount,
    });
    return mutateAsync(transaction);
  };
  
  return { repay, isPending, error };
}

export function useClaim() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getCascadeProtocolContract();
  
  const claim = async (poolId: number) => {
    const transaction = prepareContractCall({
      contract,
      method: "claim" as const,
      params: [BigInt(poolId)],
    });
    return mutateAsync(transaction);
  };
  
  return { claim, isPending, error };
}

export function useMintReceipt() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getReceiptNFTContract();
  
  const mintReceipt = async (to: string) => {
    const transaction = prepareContractCall({
      contract,
      method: "mint" as const,
      params: [to as `0x${string}`],
    });
    return mutateAsync(transaction);
  };
  
  return { mintReceipt, isPending, error };
}

export function useApproveNFT() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getReceiptNFTContract();
  
  const approveNFT = async (operator: string, tokenId: bigint) => {
    const transaction = prepareContractCall({
      contract,
      method: "approve" as const,
      params: [operator as `0x${string}`, tokenId],
    });
    return mutateAsync(transaction);
  };
  
  return { approveNFT, isPending, error };
}

export function useCreatePool() {
  const { mutateAsync, isPending, error } = useSendTransaction();
  const contract = getCascadeProtocolContract();
  
  const createPool = async (
    tokenId: bigint,
    receivableValue: bigint,
    investorReturn: bigint,
    seniorDiscBPS: bigint,
    juniorDiscBPS: bigint
  ) => {
    const transaction = prepareContractCall({
      contract,
      method: "createPool" as const,
      params: [tokenId, receivableValue, investorReturn, seniorDiscBPS, juniorDiscBPS],
    });
    return mutateAsync(transaction);
  };
  
  return { createPool, isPending, error };
}

// Helper function to find NFTs owned by an address
export async function findOwnedNFTs(ownerAddress: string, maxTokenId?: bigint): Promise<bigint[]> {
  const contract = getReceiptNFTContract();
  const { readContract } = await import("thirdweb");
  
  const ownedTokens: bigint[] = [];
  
  // Get nextId to know the range
  const nextId = (await readContract({
    contract,
    method: "nextId" as const,
    params: [],
  })) as bigint;
  
  const maxId = maxTokenId || nextId;
  const checkLimit = Number(maxId) > 100 ? 100 : Number(maxId); // Limit to 100 checks for performance
  
  // Check tokens from 0 to maxId (or nextId)
  for (let i = 0; i < checkLimit; i++) {
    try {
      const tokenOwner = (await readContract({
        contract,
        method: "ownerOf" as const,
        params: [BigInt(i)],
      })) as string;
      
      if (tokenOwner.toLowerCase() === ownerAddress.toLowerCase()) {
        ownedTokens.push(BigInt(i));
      }
    } catch (error) {
      // Token doesn't exist or error, skip
      continue;
    }
  }
  
  return ownedTokens;
}

// Check if contracts are deployed
export { areContractsDeployed };
