"use client";

import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  useMintReceipt,
  useApproveNFT,
  useCreatePool,
  getReceiptNFTContract,
  getCascadeProtocolContract,
} from "@/lib/hooks";
import { areContractsDeployed, CONTRACT_ADDRESSES, parseMNT } from "@/lib/contracts";

type MintedNFT = {
  tokenId: bigint;
  status: "minted" | "approved" | "pooled";
};

type CreatedPool = {
  id: number;
  tokenId: bigint;
  receivableValue: string;
  timestamp: Date;
};

export default function Merchant() {
  const [showForm, setShowForm] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [createdPools, setCreatedPools] = useState<CreatedPool[]>([]);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");
  const [currentStep, setCurrentStep] = useState<"mint" | "approve" | "pool">("mint");

  // Form state for pool creation
  const [selectedNFT, setSelectedNFT] = useState<bigint | null>(null);
  const [receivableValue, setReceivableValue] = useState("");
  const [investorReturn, setInvestorReturn] = useState("");
  const [seniorDiscount, setSeniorDiscount] = useState("100"); // 1% default
  const [juniorDiscount, setJuniorDiscount] = useState("1200"); // 12% default

  const contractsDeployed = areContractsDeployed();
  const account = useActiveAccount();
  const receiptNFTContract = getReceiptNFTContract();
  const cascadeContract = getCascadeProtocolContract();

  // Transaction hooks
  const { mintReceipt, isPending: isMinting } = useMintReceipt();
  const { approveNFT, isPending: isApproving } = useApproveNFT();
  const { createPool, isPending: isCreating } = useCreatePool();

  // Get next token ID
  const { data: nextId } = useReadContract({
    contract: receiptNFTContract,
    method: "nextId" as const,
    params: [],
  });

  // Get pool count for tracking created pools
  const { data: poolCount, refetch: refetchPoolCount } = useReadContract({
    contract: cascadeContract,
    method: "poolCount" as const,
    params: [],
  });

  const isPending = isMinting || isApproving || isCreating;

  // Handle minting receipt NFT
  const handleMintReceipt = async () => {
    if (!account) return;

    setTxStatus("pending");
    setTxMessage("Minting Receipt NFT...");

    try {
      await mintReceipt(account.address);

      const tokenId = nextId || 0n;
      setMintedNFTs((prev) => [...prev, { tokenId, status: "minted" }]);

      setTxStatus("success");
      setTxMessage(`Receipt NFT #${tokenId.toString()} minted successfully!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error) {
      console.error("Mint error:", error);
      setTxStatus("error");
      setTxMessage(error instanceof Error ? error.message : "Minting failed");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  // Handle approving NFT for CascadeProtocol
  const handleApproveNFT = async (tokenId: bigint) => {
    if (!account) return;

    setTxStatus("pending");
    setTxMessage("Approving NFT for pool creation...");

    try {
      await approveNFT(CONTRACT_ADDRESSES.CASCADE_PROTOCOL, tokenId);

      setMintedNFTs((prev) =>
        prev.map((nft) => (nft.tokenId === tokenId ? { ...nft, status: "approved" } : nft))
      );

      setTxStatus("success");
      setTxMessage(`NFT #${tokenId.toString()} approved!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error) {
      console.error("Approve error:", error);
      setTxStatus("error");
      setTxMessage(error instanceof Error ? error.message : "Approval failed");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  // Handle creating pool
  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedNFT) return;

    setTxStatus("pending");
    setTxMessage("Creating receivables pool...");

    try {
      const receivableWei = parseMNT(receivableValue);
      const investorReturnWei = parseMNT(investorReturn);
      const seniorBPS = BigInt(seniorDiscount);
      const juniorBPS = BigInt(juniorDiscount);

      await createPool(selectedNFT, receivableWei, investorReturnWei, seniorBPS, juniorBPS);

      // Mark NFT as pooled
      setMintedNFTs((prev) =>
        prev.map((nft) => (nft.tokenId === selectedNFT ? { ...nft, status: "pooled" } : nft))
      );

      // Add to created pools
      const newPoolId = poolCount ? Number(poolCount) + 1 : 1;
      setCreatedPools((prev) => [
        {
          id: newPoolId,
          tokenId: selectedNFT,
          receivableValue,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      // Reset form
      setSelectedNFT(null);
      setReceivableValue("");
      setInvestorReturn("");
      setShowForm(false);
      refetchPoolCount();

      setTxStatus("success");
      setTxMessage(`Pool #${newPoolId} created successfully!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error) {
      console.error("Create pool error:", error);
      setTxStatus("error");
      setTxMessage(error instanceof Error ? error.message : "Pool creation failed");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  // Contract not deployed state
  if (!contractsDeployed) {
    return (
      <div className="w-full min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-12 animate-fade-in flex items-center flex-col">
            <h1 className="text-5xl font-bold text-foreground font-stack-sans-text mb-2">
              Merchant Dashboard
            </h1>
            <p className="text-foreground/70 font-stack-sans-text">
              Create and manage your receivables pools
            </p>
          </div>

          <div className="p-12 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-center animate-fade-in">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-2xl font-bold mb-4 text-yellow-500 font-stack-sans-text">
              Contracts Not Yet Deployed
            </h2>
            <p className="text-foreground/70 mb-4 font-stack-sans-text max-w-xl mx-auto">
              Deploy the contracts to Mantle testnet to start creating receivables pools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 animate-fade-in flex items-center flex-col">
          <h1 className="text-5xl font-bold text-foreground font-stack-sans-text mb-2">
            Merchant Dashboard
          </h1>
          <p className="text-foreground/70 font-stack-sans-text">
            Tokenize receivables and get instant liquidity on Mantle
          </p>
        </div>

        {/* Transaction Status */}
        {txStatus !== "idle" && (
          <div
            className={`mb-8 p-4 rounded-xl border animate-fade-in ${
              txStatus === "pending"
                ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-500"
                : txStatus === "success"
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-red-500/30 bg-red-500/5 text-red-500"
            }`}
          >
            <div className="flex items-center gap-3">
              {txStatus === "pending" && <Loader2 className="w-5 h-5 animate-spin" />}
              {txStatus === "success" && <span className="text-xl">✓</span>}
              {txStatus === "error" && <span className="text-xl">✕</span>}
              <span className="font-stack-sans-text">{txMessage}</span>
            </div>
          </div>
        )}

        {!account ? (
          <div className="p-12 rounded-2xl border border-foreground/15 bg-background/10 text-center animate-fade-in">
            <div className="text-6xl mb-6">🔗</div>
            <h2 className="text-2xl font-bold mb-4 text-foreground font-stack-sans-text">
              Connect Your Wallet
            </h2>
            <p className="text-foreground/70 font-stack-sans-text">
              Connect your wallet to start tokenizing receivables
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-1 gap-8">
            {/* Step 1: Mint Receipt NFT */}
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground font-stack-sans-text">
                      Step 1: Mint Receipt NFT
                    </h2>
                    <p className="text-sm text-foreground/60 font-stack-sans-text mt-1">
                      Create a tokenized invoice as an NFT
                    </p>
                  </div>
                  <button
                    onClick={handleMintReceipt}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      "Mint Receipt NFT"
                    )}
                  </button>
                </div>

                {mintedNFTs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground/80 font-stack-sans-text">
                      Your Receipt NFTs:
                    </p>
                    {mintedNFTs.map((nft) => (
                      <div
                        key={nft.tokenId.toString()}
                        className="flex items-center justify-between p-4 rounded-xl border border-foreground/10 bg-background/5"
                      >
                        <div>
                          <span className="font-semibold text-foreground font-stack-sans-text">
                            Receipt NFT #{nft.tokenId.toString()}
                          </span>
                          <span
                            className={`ml-3 px-2 py-1 rounded-full text-xs font-bold border font-stack-sans-text ${
                              nft.status === "pooled"
                                ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
                                : nft.status === "approved"
                                  ? "text-primary bg-primary/10 border-primary/30"
                                  : "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
                            }`}
                          >
                            {nft.status.toUpperCase()}
                          </span>
                        </div>
                        {nft.status === "minted" && (
                          <button
                            onClick={() => handleApproveNFT(nft.tokenId)}
                            disabled={isPending}
                            className="px-4 py-2 rounded-full border border-primary/30 text-primary font-semibold transition-all duration-300 hover:bg-primary/10 font-stack-sans-text text-sm disabled:opacity-50"
                          >
                            {isApproving ? "Approving..." : "Approve for Pool"}
                          </button>
                        )}
                        {nft.status === "approved" && (
                          <button
                            onClick={() => {
                              setSelectedNFT(nft.tokenId);
                              setShowForm(true);
                            }}
                            className="px-4 py-2 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] font-stack-sans-text text-sm"
                          >
                            Create Pool
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Create Pool Form */}
            {showForm && selectedNFT !== null && (
              <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 ring-1 ring-primary/20">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground font-stack-sans-text">
                        Step 2: Create Receivables Pool
                      </h2>
                      <p className="text-sm text-foreground/60 font-stack-sans-text mt-1">
                        Using Receipt NFT #{selectedNFT.toString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setSelectedNFT(null);
                      }}
                      className="text-foreground/60 hover:text-foreground transition-colors font-stack-sans-text"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleCreatePool} className="space-y-4">
                    {/* Receivable Value */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                        Receivable Value (MNT)
                      </label>
                      <input
                        type="number"
                        value={receivableValue}
                        onChange={(e) => setReceivableValue(e.target.value)}
                        required
                        step="0.0001"
                        min="0"
                        placeholder="Total invoice value"
                        className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                      />
                      <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                        You&apos;ll receive 80% ({receivableValue ? (parseFloat(receivableValue) * 0.8).toFixed(4) : "0"} MNT) as advance
                      </p>
                    </div>

                    {/* Investor Return */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                        Investor Return (MNT)
                      </label>
                      <input
                        type="number"
                        value={investorReturn}
                        onChange={(e) => setInvestorReturn(e.target.value)}
                        required
                        step="0.0001"
                        min="0"
                        placeholder="Total interest for investors"
                        className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                      />
                    </div>

                    {/* Discount Rates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                          Senior Discount (BPS)
                        </label>
                        <input
                          type="number"
                          value={seniorDiscount}
                          onChange={(e) => setSeniorDiscount(e.target.value)}
                          required
                          min="0"
                          placeholder="100 = 1%"
                          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                        />
                        <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                          {(parseInt(seniorDiscount) / 100 || 0).toFixed(2)}% discount
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                          Junior Discount (BPS)
                        </label>
                        <input
                          type="number"
                          value={juniorDiscount}
                          onChange={(e) => setJuniorDiscount(e.target.value)}
                          required
                          min="0"
                          placeholder="1200 = 12%"
                          className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                        />
                        <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                          {(parseInt(juniorDiscount) / 100 || 0).toFixed(2)}% discount
                        </p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full px-6 py-3 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Pool...
                        </>
                      ) : (
                        "Create Pool"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Created Pools */}
            {createdPools.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                  <h2 className="text-xl font-bold mb-6 text-foreground font-stack-sans-text">
                    Your Created Pools
                  </h2>
                  <div className="space-y-4">
                    {createdPools.map((pool) => (
                      <Link
                        key={pool.id}
                        href={`/pools/${pool.id}`}
                        className="block p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-foreground font-stack-sans-text">
                              Pool #{pool.id}
                            </h3>
                            <p className="text-sm text-foreground/60 font-stack-sans-text">
                              NFT #{pool.tokenId.toString()} • {pool.receivableValue} MNT
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold border bg-primary/10 text-primary border-primary/30 font-stack-sans-text">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-xs text-foreground/50 mt-2 font-stack-sans-text">
                          Created {pool.timestamp.toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                <h2 className="text-xl font-bold mb-6 text-foreground font-stack-sans-text">
                  How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                    <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold mb-3">
                      1
                    </div>
                    <h3 className="font-semibold text-foreground font-stack-sans-text mb-1">
                      Mint Receipt NFT
                    </h3>
                    <p className="text-sm text-foreground/60 font-stack-sans-text">
                      Tokenize your invoice as an NFT on Mantle
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                    <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold mb-3">
                      2
                    </div>
                    <h3 className="font-semibold text-foreground font-stack-sans-text mb-1">
                      Create Pool
                    </h3>
                    <p className="text-sm text-foreground/60 font-stack-sans-text">
                      Set up a receivables pool with investor tranches
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
                    <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center font-bold mb-3">
                      3
                    </div>
                    <h3 className="font-semibold text-foreground font-stack-sans-text mb-1">
                      Get Advance
                    </h3>
                    <p className="text-sm text-foreground/60 font-stack-sans-text">
                      Receive 80% of receivable value instantly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
