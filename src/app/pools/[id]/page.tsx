"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import {
  getCascadeProtocolContract,
  parsePoolData,
  calculatePoolStats,
  useInvestSenior,
  useInvestJunior,
  useClaim,
  type PoolData,
} from "@/lib/hooks";
import { areContractsDeployed, parseMNT, formatMNT } from "@/lib/contracts";

export default function PoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const poolId = parseInt(id);
  const [selectedTranche, setSelectedTranche] = useState<"senior" | "junior">("senior");
  const [investAmount, setInvestAmount] = useState("");
  const [animatedTotalValue, setAnimatedTotalValue] = useState(0);
  const [animatedTotalFunded, setAnimatedTotalFunded] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");

  const contractsDeployed = areContractsDeployed();
  const contract = getCascadeProtocolContract();
  const account = useActiveAccount();

  // Fetch pool data from contract
  const { data: poolData, isLoading, refetch } = useReadContract({
    contract,
    method: "pools" as const,
    params: [BigInt(poolId)],
  });

  // Transaction hooks
  const { investSenior, isPending: isPendingSenior } = useInvestSenior();
  const { investJunior, isPending: isPendingJunior } = useInvestJunior();
  const { claim, isPending: isPendingClaim } = useClaim();

  const isPending = isPendingSenior || isPendingJunior || isPendingClaim;

  // Parse pool data
  const pool: PoolData | null = poolData && poolData[0] !== "0x0000000000000000000000000000000000000000"
    ? parsePoolData(poolId, poolData)
    : null;

  const poolStats = pool ? calculatePoolStats(pool) : null;

  // Animate pool stats when pool loads
  useEffect(() => {
    if (!pool || !poolStats) return;

    const duration = 1000;
    const steps = 30;
    const stepInterval = duration / steps;

    // Total funded target (what investors are expected to fund)
    const totalFundTarget = Number(pool.seniorTargetRaise + pool.juniorTargetRaise) / 1e18;
    // Advance amount A to merchant
    const advanceAmount = Number(pool.advanceAmount) / 1e18;
    const progress = poolStats.fundingProgress;

    // Animate Total Funded (Target)
    const totalValueIncrement = totalFundTarget / steps;
    let totalValueStep = 0;
    const totalValueInterval = setInterval(() => {
      totalValueStep++;
      setAnimatedTotalValue(Math.min(totalValueIncrement * totalValueStep, totalFundTarget));
      if (totalValueStep >= steps) clearInterval(totalValueInterval);
    }, stepInterval);

    // Animate Advance Amount
    const totalFundedIncrement = advanceAmount / steps;
    let totalFundedStep = 0;
    const totalFundedInterval = setInterval(() => {
      totalFundedStep++;
      setAnimatedTotalFunded(Math.min(totalFundedIncrement * totalFundedStep, advanceAmount));
      if (totalFundedStep >= steps) clearInterval(totalFundedInterval);
    }, stepInterval);

    // Animate Progress
    const progressIncrement = progress / steps;
    let progressStep = 0;
    const progressInterval = setInterval(() => {
      progressStep++;
      setAnimatedProgress(Math.min(progressIncrement * progressStep, progress));
      if (progressStep >= steps) clearInterval(progressInterval);
    }, stepInterval);

    return () => {
      clearInterval(totalValueInterval);
      clearInterval(totalFundedInterval);
      clearInterval(progressInterval);
    };
  }, [pool, poolStats]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !investAmount) return;

    setTxStatus("pending");
    setTxMessage("Confirming transaction...");

    try {
      const amountWei = parseMNT(investAmount);

      if (selectedTranche === "senior") {
        await investSenior(poolId, amountWei);
      } else {
        await investJunior(poolId, amountWei);
      }

      setTxStatus("success");
      setTxMessage("Investment successful!");
    setInvestAmount("");
      refetch();

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error) {
      console.error("Investment error:", error);
      setTxStatus("error");
      setTxMessage(error instanceof Error ? error.message : "Transaction failed");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  const handleClaim = async () => {
    if (!account) return;

    setTxStatus("pending");
    setTxMessage("Claiming returns...");

    try {
      await claim(poolId);

      setTxStatus("success");
      setTxMessage("Claim successful!");
      refetch();

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error) {
      console.error("Claim error:", error);
      setTxStatus("error");
      setTxMessage(error instanceof Error ? error.message : "Claim failed");

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  // Contract not deployed state
  if (!contractsDeployed) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
              <Link href="/pools">
                <button className="flex items-center gap-2 px-4 py-2 bg-background/10 hover:bg-background/20 border border-primary/20 rounded-lg font-semibold font-stack-sans-text transition-all duration-300">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Pools
                </button>
              </Link>
            </div>

            <div className="p-12 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-center animate-fade-in">
              <div className="text-6xl mb-6">🚧</div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-500 font-stack-sans-text">
                Contracts Not Yet Deployed
              </h2>
              <p className="text-foreground/70 font-stack-sans-text">
                Deploy contracts to Mantle testnet to view pool details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-foreground/70 font-stack-sans-text">Loading pool...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pool not found
  if (!pool) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
              <Link href="/pools">
                <button className="flex items-center gap-2 px-4 py-2 bg-background/10 hover:bg-background/20 border border-primary/20 rounded-lg font-semibold font-stack-sans-text transition-all duration-300">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Pools
                </button>
              </Link>
            </div>

            <div className="p-12 rounded-2xl border border-foreground/15 bg-background/10 text-center animate-fade-in">
              <div className="text-6xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold mb-4 text-foreground font-stack-sans-text">
                Pool Not Found
              </h2>
              <p className="text-foreground/70 font-stack-sans-text">
                Pool #{poolId} does not exist or has not been created yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <Link href="/pools">
              <button className="flex items-center gap-2 px-4 py-2 bg-background/10 hover:bg-background/20 border border-primary/20 rounded-lg font-semibold font-stack-sans-text transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
                Back to Pools
              </button>
            </Link>
          </div>

          <div className="mb-12 text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1
              className="text-5xl font-bold text-foreground mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Pool #{poolId}
            </h1>
            <p
              className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Merchant: {pool.merchant.slice(0, 6)}...{pool.merchant.slice(-4)}
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

          {/* Pool Overview */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="border border-primary/20 bg-background/5 rounded-xl p-6 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 font-bold uppercase tracking-wide mb-2 font-stack-sans-text">
                    Total Funded (Target)
                  </p>
                  <p className="text-3xl font-bold text-foreground font-stack-sans-text">
                    {animatedTotalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} MNT
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <div className="border border-primary/20 bg-background/5 rounded-xl p-6 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 font-bold uppercase tracking-wide mb-2 font-stack-sans-text">
                    Advance to Merchant (A)
                  </p>
                  <p className="text-3xl font-bold text-primary font-stack-sans-text">
                    {animatedTotalFunded.toLocaleString(undefined, { maximumFractionDigits: 2 })} MNT
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <div className="border border-primary/20 bg-background/5 rounded-xl p-6 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 font-bold uppercase tracking-wide mb-2 font-stack-sans-text">
                    Progress
                  </p>
                  <p className="text-3xl font-bold text-primary font-stack-sans-text">
                    {animatedProgress.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <div className="w-4 h-4 bg-background rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-primary/20 bg-background/5 rounded-xl p-6 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 font-bold uppercase tracking-wide mb-2 font-stack-sans-text">
                    Status
                  </p>
                  <p className={`text-2xl font-bold font-stack-sans-text ${pool.isFunded ? "text-blue-400" : "text-primary"}`}>
                    {pool.isFunded ? "FUNDED" : "ACTIVE"}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1 font-stack-sans-text">
                    Repaid: {poolStats ? poolStats.totalRaised : "0"} MNT
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-primary rounded-lg"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Investment Form */}
            <div className="lg:col-span-2">
              <div
                className="p-6 rounded-xl border border-primary/20 bg-background/5 animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                <h2 className="text-2xl font-bold mb-6 text-foreground font-stack-sans-text">
                  {pool.isFunded ? "Pool is Fully Funded" : "Invest in Pool"}
                </h2>

                {!account ? (
                  <div className="text-center py-8">
                    <p className="text-foreground/60 font-stack-sans-text mb-4">
                      Connect your wallet to invest
                    </p>
                  </div>
                ) : pool.isFunded ? (
                  <div className="space-y-6">
                    <p className="text-foreground/70 font-stack-sans-text">
                      This pool has been fully funded. The merchant has received their advance.
                      You can claim your returns once the receivable is repaid.
                    </p>
                    <button
                      onClick={handleClaim}
                      disabled={isPending}
                      className="w-full px-6 py-3 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] hover:brightness-110 font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isPendingClaim ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        "Claim Returns"
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                {/* Tranche Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setSelectedTranche("senior")}
                    className={`p-6 rounded-xl border transition-all duration-300 ${
                      selectedTranche === "senior"
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-foreground/20 bg-background hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-lg mb-2 text-foreground font-stack-sans-text">
                        Senior Tranche
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-foreground/60 font-stack-sans-text">
                          Lower risk, stable returns
                        </p>
                        <p className="text-2xl font-bold text-primary font-stack-sans-text">
                              {poolStats?.seniorAPY.toFixed(1)}% ROI
                        </p>
                        <div className="pt-2 border-t border-foreground/10">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/60 font-stack-sans-text">
                              Progress
                            </span>
                            <span className="font-semibold text-foreground font-stack-sans-text">
                                  {poolStats?.seniorProgress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                    width: `${Math.min(poolStats?.seniorProgress || 0, 100)}%`,
                              }}
                            ></div>
                          </div>
                              <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                                {poolStats?.seniorRaised} / {poolStats?.seniorTarget} MNT
                              </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedTranche("junior")}
                    className={`p-6 rounded-xl border transition-all duration-300 ${
                      selectedTranche === "junior"
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-foreground/20 bg-background hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-lg mb-2 text-foreground font-stack-sans-text">
                        Junior Tranche
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-foreground/60 font-stack-sans-text">
                          Higher risk, higher returns
                        </p>
                        <p className="text-2xl font-bold text-primary font-stack-sans-text">
                              {poolStats?.juniorAPY.toFixed(1)}% ROI
                        </p>
                        <div className="pt-2 border-t border-foreground/10">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/60 font-stack-sans-text">
                              Progress
                            </span>
                            <span className="font-semibold text-foreground font-stack-sans-text">
                                  {poolStats?.juniorProgress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                    width: `${Math.min(poolStats?.juniorProgress || 0, 100)}%`,
                              }}
                            ></div>
                              </div>
                              <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                                {poolStats?.juniorRaised} / {poolStats?.juniorTarget} MNT
                              </p>
                            </div>
                          </div>
                        </div>
                  </button>
                </div>

                {/* Investment Amount */}
                <form onSubmit={handleInvest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                      Investment Amount (MNT)
                    </label>
                    <input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      required
                          step="0.0001"
                      min="0"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                    />
                  </div>

                  <button
                    type="submit"
                        disabled={isPending || !investAmount}
                        className="w-full px-6 py-3 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] hover:brightness-110 font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                        {isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Invest in ${selectedTranche === "senior" ? "Senior" : "Junior"} Tranche`
                        )}
                  </button>
                </form>
                  </>
                )}
              </div>
            </div>

            {/* Pool Info */}
            <div className="space-y-6">
              <div
                className="p-6 rounded-xl border border-primary/20 bg-background/5 animate-fade-in"
                style={{ animationDelay: "0.4s" }}
              >
                <h3 className="font-bold text-lg mb-4 text-foreground font-stack-sans-text">
                  Pool Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border font-stack-sans-text ${
                      pool.isFunded
                        ? "bg-blue-400/20 text-blue-400 border-blue-400/20"
                        : "bg-primary/20 text-primary border-primary/20"
                    }`}>
                      {pool.isFunded ? "FUNDED" : "ACTIVE"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Receivable Value</span>
                    <span className="font-semibold text-foreground font-stack-sans-text">
                      {poolStats?.totalValue} MNT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Advance (80%)</span>
                    <span className="font-semibold text-primary font-stack-sans-text">
                      {poolStats?.advanceAmount} MNT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Total Receive (C)</span>
                    <span className="font-semibold text-foreground font-stack-sans-text">
                      {poolStats?.totalReceive} MNT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Total Repaid</span>
                    <span className="font-semibold text-foreground font-stack-sans-text">
                      {formatMNT(pool.totalRepaid)} MNT
                    </span>
              </div>
            </div>
          </div>

              {/* Contract Addresses */}
          <div
            className="p-6 rounded-xl border border-primary/20 bg-background/5 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
                <h3 className="font-bold text-lg mb-4 text-foreground font-stack-sans-text">
                  Tranche Tokens
                </h3>
                <div className="space-y-3 text-sm">
                      <div>
                    <p className="text-foreground/60 font-stack-sans-text mb-1">Senior Token</p>
                    <p className="font-mono text-xs text-foreground break-all">
                      {pool.seniorToken}
                        </p>
                      </div>
                      <div>
                    <p className="text-foreground/60 font-stack-sans-text mb-1">Junior Token</p>
                    <p className="font-mono text-xs text-foreground break-all">
                      {pool.juniorToken}
                        </p>
                  </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
