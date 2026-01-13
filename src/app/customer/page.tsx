"use client";

import { useState } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { Loader2 } from "lucide-react";
import {
  useRepay,
  getCascadeProtocolContract,
  parsePoolData,
  calculatePoolStats,
  type PoolData,
} from "@/lib/hooks";
import { areContractsDeployed, parseMNT, formatMNT } from "@/lib/contracts";

type RepaymentHistory = {
  poolId: number;
  amount: string;
  timestamp: Date;
  txHash?: string;
};

export default function CustomerPage() {
  const [poolIdInput, setPoolIdInput] = useState("");
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repaymentHistory, setRepaymentHistory] = useState<RepaymentHistory[]>([]);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const contractsDeployed = areContractsDeployed();
  const account = useActiveAccount();
  const contract = getCascadeProtocolContract();

  // Transaction hook
  const { repay, isPending } = useRepay();

  // Fetch pool data when searching
  const poolId = poolIdInput ? parseInt(poolIdInput) : 0;
  const { data: poolData, isLoading: isLoadingPool, refetch } = useReadContract({
    contract,
    method: "pools" as const,
    params: [BigInt(poolId)],
  });

  // Handle pool lookup
  const handleLookupPool = () => {
    if (!poolIdInput) return;
    setIsSearching(true);

    // Check if pool exists
    if (poolData && poolData[0] !== "0x0000000000000000000000000000000000000000") {
      const pool = parsePoolData(parseInt(poolIdInput), poolData);
      setSelectedPool(pool);
    } else {
      setSelectedPool(null);
      setTxStatus("error");
      setTxMessage(`Pool #${poolIdInput} not found`);
      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    }
    setIsSearching(false);
  };

  // Handle repayment
  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedPool || !repayAmount) return;

    setTxStatus("pending");
    setTxMessage("Processing repayment...");

    try {
      const amountWei = parseMNT(repayAmount);
      await repay(selectedPool.id, amountWei);

      // Add to history
      setRepaymentHistory((prev) => [
        {
          poolId: selectedPool.id,
          amount: repayAmount,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTxStatus("success");
      setTxMessage(`Successfully repaid ${repayAmount} MNT to Pool #${selectedPool.id}!`);
      setRepayAmount("");
      refetch();

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error) {
      console.error("Repay error:", error);
      setTxStatus("error");
      setTxMessage(error instanceof Error ? error.message : "Repayment failed");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  const poolStats = selectedPool ? calculatePoolStats(selectedPool) : null;

  // Calculate remaining debt
  const calculateRemainingDebt = () => {
    if (!selectedPool) return "0";
    const totalDebt = selectedPool.seniorFaceValue + selectedPool.juniorFaceValue;
    const remaining = totalDebt > selectedPool.totalRepaid 
      ? totalDebt - selectedPool.totalRepaid 
      : 0n;
    return formatMNT(remaining);
  };

  // Contract not deployed state
  if (!contractsDeployed) {
    return (
      <div className="w-full min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center animate-fade-in">
              <h1
                className="text-5xl font-bold mb-3 text-foreground"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Customer Portal
              </h1>
              <p className="text-lg text-foreground/70 font-stack-sans-text">
                Repay your receivables on Mantle
              </p>
            </div>

            <div className="p-12 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-center animate-fade-in">
              <div className="text-6xl mb-6">🚧</div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-500 font-stack-sans-text">
                Contracts Not Yet Deployed
              </h2>
              <p className="text-foreground/70 font-stack-sans-text">
                Deploy contracts to Mantle testnet to use the customer portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center animate-fade-in">
            <h1
              className="text-5xl font-bold mb-3 text-foreground"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Customer Portal
            </h1>
            <p className="text-lg text-foreground/70 font-stack-sans-text">
              Repay your receivables and track your payment history
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
                Connect your wallet to repay receivables
              </p>
            </div>
          ) : (
            <>
              {/* Pool Lookup */}
              <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                  <h2 className="text-xl font-bold mb-4 text-foreground font-stack-sans-text">
                    Find Your Pool
                  </h2>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={poolIdInput}
                      onChange={(e) => setPoolIdInput(e.target.value)}
                      placeholder="Enter Pool ID"
                      min="1"
                      className="flex-1 px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                    />
                    <button
                      onClick={handleLookupPool}
                      disabled={!poolIdInput || isLoadingPool}
                      className="px-6 py-3 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoadingPool ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Lookup Pool"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Pool & Repayment */}
              {selectedPool && (
                <div className="mb-8 animate-fade-in">
                  <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 ring-1 ring-primary/20">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground font-stack-sans-text">
                          Pool #{selectedPool.id}
                        </h2>
                        <p className="text-sm text-foreground/60 font-stack-sans-text mt-1">
                          Merchant: {selectedPool.merchant.slice(0, 6)}...{selectedPool.merchant.slice(-4)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold border font-stack-sans-text ${
                          selectedPool.isFunded
                            ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
                            : "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
                        }`}
                      >
                        {selectedPool.isFunded ? "FUNDED" : "FUNDING"}
                      </span>
                    </div>

                    {/* Pool Details */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-background/10 border border-foreground/10">
                        <p className="text-sm text-foreground/60 font-stack-sans-text mb-1">
                          Receivable Value
                        </p>
                        <p className="text-xl font-bold text-foreground font-stack-sans-text">
                          {poolStats?.totalValue} MNT
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-background/10 border border-foreground/10">
                        <p className="text-sm text-foreground/60 font-stack-sans-text mb-1">
                          Total Repaid
                        </p>
                        <p className="text-xl font-bold text-primary font-stack-sans-text">
                          {formatMNT(selectedPool.totalRepaid)} MNT
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-background/10 border border-foreground/10">
                        <p className="text-sm text-foreground/60 font-stack-sans-text mb-1">
                          Total Debt (Senior + Junior)
                        </p>
                        <p className="text-xl font-bold text-foreground font-stack-sans-text">
                          {formatMNT(selectedPool.seniorFaceValue + selectedPool.juniorFaceValue)} MNT
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-background/10 border border-foreground/10">
                        <p className="text-sm text-foreground/60 font-stack-sans-text mb-1">
                          Remaining Debt
                        </p>
                        <p className="text-xl font-bold text-red-400 font-stack-sans-text">
                          {calculateRemainingDebt()} MNT
                        </p>
                      </div>
                    </div>

                    {!selectedPool.isFunded ? (
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                        <p className="text-yellow-500 font-stack-sans-text">
                          This pool is not yet fully funded. Repayment will be available once investors fund the pool.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleRepay} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                            Repayment Amount (MNT)
                          </label>
                          <input
                            type="number"
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            required
                            step="0.0001"
                            min="0"
                            placeholder="Enter amount to repay"
                            className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isPending || !repayAmount}
                          className="w-full px-6 py-3 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Make Repayment"
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Repayment History */}
              {repaymentHistory.length > 0 && (
                <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                    <h3 className="text-lg font-bold mb-4 text-foreground font-stack-sans-text">
                      Your Recent Repayments
                    </h3>
                    <div className="space-y-3">
                      {repaymentHistory.map((payment, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-semibold text-foreground font-stack-sans-text">
                              {payment.amount} MNT
                            </div>
                            <div className="text-xs text-foreground/50 font-stack-sans-text">
                              Pool #{payment.poolId} • {payment.timestamp.toLocaleString()}
                            </div>
                          </div>
                          <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/20 font-stack-sans-text">
                            ✓ Confirmed
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="mt-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="text-center mb-8">
                  <h3
                    className="text-3xl font-bold text-foreground mb-3"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    How Repayment Works
                  </h3>
                  <p className="text-foreground/60 font-stack-sans-text">
                    Simple steps to repay your receivables
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: 1,
                      title: "Find Your Pool",
                      description: "Enter your pool ID to view details",
                      icon: "🔍",
                    },
                    {
                      step: 2,
                      title: "Make Payment",
                      description: "Repay in MNT to the pool contract",
                      icon: "💰",
                    },
                    {
                      step: 3,
                      title: "Track Progress",
                      description: "Monitor repayment status on-chain",
                      icon: "📊",
                    },
                  ].map((workflow, i) => (
                    <div
                      key={i}
                      className="group relative animate-fade-in"
                      style={{ animationDelay: `${i * 0.1 + 0.4}s` }}
                    >
                      <div className="relative p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary text-background text-sm font-stack-sans-text font-bold shadow-lg shadow-primary/30">
                            {workflow.step}
                          </div>
                          <div className="text-2xl text-primary/70">{workflow.icon}</div>
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-foreground font-stack-sans-text">
                          {workflow.title}
                        </h3>
                        <p className="text-sm text-foreground/60 font-stack-sans-text">
                          {workflow.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
