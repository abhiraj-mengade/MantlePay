"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useReadContract } from "thirdweb/react";
import { getCascadeProtocolContract, parsePoolData, calculatePoolStats, type PoolData } from "@/lib/hooks";
import { areContractsDeployed, formatMNT } from "@/lib/contracts";

export default function Pools() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pools, setPools] = useState<PoolData[]>([]);
  const poolsPerPage = 6;
  const contractsDeployed = areContractsDeployed();
  const contract = getCascadeProtocolContract();

  // Get pool count from contract
  const { data: poolCount, isLoading: isLoadingCount } = useReadContract({
    contract,
    method: "poolCount" as const,
    params: [],
  });

  // Fetch all pools dynamically
  // Note: Pool IDs start from 1 in the contract
  const poolIds = poolCount ? Array.from({ length: Number(poolCount) }, (_, i) => i + 1) : [];

  // Fetch all pools using readContract
  useEffect(() => {
    const fetchAllPools = async () => {
      if (!contractsDeployed || !poolCount || poolIds.length === 0) {
        setPools([]);
        return;
      }

      try {
        const { readContract } = await import("thirdweb");
        const fetchedPools: PoolData[] = [];

        // Fetch all pools in parallel
        const poolPromises = poolIds.map(async (poolId) => {
          try {
            const data = await readContract({
              contract,
              method: "pools" as const,
              params: [BigInt(poolId)],
            });

            // Check if pool exists (merchant address is not zero)
            if (data && data[0] !== "0x0000000000000000000000000000000000000000") {
              return parsePoolData(poolId, data);
            }
            return null;
          } catch (error) {
            console.error(`Error fetching pool ${poolId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(poolPromises);
        const validPools = results.filter((pool): pool is PoolData => pool !== null);
        
        // Sort by pool ID (newest first)
        validPools.sort((a, b) => b.id - a.id);
        
        setPools(validPools);
      } catch (error) {
        console.error("Error fetching pools:", error);
        setPools([]);
      }
    };

    fetchAllPools();
  }, [contractsDeployed, poolCount, contract, poolIds.join(",")]);

  const isLoading = isLoadingCount;

  const calculateStats = () => {
    if (pools.length === 0) {
      return {
        totalPools: poolCount ? Number(poolCount) : 0,
        totalValue: "0",
        totalFunded: "0",
        avgAPY: "0",
      };
    }

    let totalValueWei = 0n;
    let totalFundedWei = 0n;
    let totalAPY = 0;

    pools.forEach((pool) => {
      const stats = calculatePoolStats(pool);
      totalValueWei += pool.receivableValue;
      totalFundedWei += pool.seniorRaised + pool.juniorRaised;
      totalAPY += (stats.seniorAPY + stats.juniorAPY) / 2;
    });

    return {
      totalPools: poolCount ? Number(poolCount) : pools.length,
      totalValue: formatMNT(totalValueWei),
      totalFunded: formatMNT(totalFundedWei),
      avgAPY: pools.length > 0 ? (totalAPY / pools.length).toFixed(1) : "0",
    };
  };

  const stats = calculateStats();

  const indexOfLastPool = currentPage * poolsPerPage;
  const indexOfFirstPool = indexOfLastPool - poolsPerPage;
  const currentPools = pools.slice(indexOfFirstPool, indexOfLastPool);
  const totalPages = Math.ceil(pools.length / poolsPerPage);

  // Show placeholder when contracts not deployed
  if (!contractsDeployed) {
    return (
      <div className="w-full min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-16 text-center animate-fade-in">
              <h1
                className="text-[clamp(2.5rem,6vw,4rem)] font-bold tracking-tight mb-4"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Receivable Pools
              </h1>
              <p
                className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Browse and invest in tokenized receivable pools with transparent, blockchain-secured
                returns
              </p>
            </div>

            {/* Contract Not Deployed Message */}
            <div className="p-12 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 text-center animate-fade-in">
              <div className="text-6xl mb-6">🚧</div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-500 font-stack-sans-text">
                Contracts Not Yet Deployed
              </h2>
              <p className="text-foreground/70 mb-4 font-stack-sans-text max-w-xl mx-auto">
                The CascadeProtocol and ReceiptNFT contracts need to be deployed to Mantle testnet.
                Once deployed, update the contract addresses in{" "}
                <code className="bg-foreground/10 px-2 py-1 rounded">src/lib/contracts.ts</code>
              </p>
              <div className="flex flex-col items-center gap-2 mt-6 text-sm text-foreground/60 font-stack-sans-text">
                <p>1. Deploy ReceiptNFT contract first</p>
                <p>2. Deploy CascadeProtocol with ReceiptNFT address</p>
                <p>3. Update CONTRACT_ADDRESSES in contracts.ts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16 text-center animate-fade-in">
            <h1
              className="text-[clamp(2.5rem,6vw,4rem)] font-bold tracking-tight mb-4"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Receivable Pools
            </h1>
            <p
              className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Browse and invest in tokenized receivable pools with transparent, blockchain-secured
              returns
            </p>
          </div>

          {/* Pool Statistics */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Total Pools
              </p>
              <p className="text-3xl font-bold text-primary font-stack-sans-text">
                {stats.totalPools}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Total Value
              </p>
              <p className="text-3xl font-bold text-foreground font-stack-sans-text">
                {stats.totalValue} MNT
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Total Funded
              </p>
              <p className="text-3xl font-bold text-primary font-stack-sans-text">
                {stats.totalFunded} MNT
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Avg ROI
              </p>
              <p className="text-3xl font-bold text-primary font-stack-sans-text">
                {stats.avgAPY}%
              </p>
            </div>
          </div>

          {/* Active Pools */}
          <div className="mb-16">
            <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-2xl font-bold font-stack-sans-text">Available Pools</h2>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl border border-foreground/20 bg-background/5 animate-pulse"
                  >
                    <div className="h-6 bg-foreground/10 rounded mb-4"></div>
                    <div className="h-4 bg-foreground/5 rounded mb-2"></div>
                    <div className="h-4 bg-foreground/5 rounded"></div>
                  </div>
                ))}
              </div>
            ) : pools.length === 0 ? (
              <div className="p-12 rounded-2xl border border-foreground/15 bg-background/10 text-center">
                <div className="text-6xl mb-6">📭</div>
                <h3 className="text-xl font-bold mb-2 text-foreground font-stack-sans-text">
                  No Pools Available Yet
                </h3>
                <p className="text-foreground/60 font-stack-sans-text">
                  Be the first to create a receivables pool!
                </p>
                <Link
                  href="/merchant"
                  className="inline-block mt-6 px-6 py-3 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text"
                >
                  Create Pool
                </Link>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {currentPools.map((pool, index) => {
                    const poolStats = calculatePoolStats(pool);

                    return (
                      <Link
                        key={pool.id}
                        href={`/pools/${pool.id}`}
                        className="group block animate-fade-in"
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 h-full">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground font-stack-sans-text">
                              Pool #{pool.id}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold border font-stack-sans-text ${
                                pool.isFunded
                                  ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
                                  : "text-primary bg-primary/10 border-primary/30"
                              }`}
                            >
                              {pool.isFunded ? "FUNDED" : "ACTIVE"}
                            </span>
                          </div>

                          <p
                            className="text-sm text-foreground/60 mb-4 truncate"
                            style={{ fontFamily: "var(--font-lato)" }}
                          >
                            Merchant: {pool.merchant.slice(0, 6)}...{pool.merchant.slice(-4)}
                          </p>

                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/60 font-stack-sans-text">
                                Total Value
                              </span>
                              <span className="font-semibold text-primary font-stack-sans-text">
                                {poolStats.totalValue} MNT
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/60 font-stack-sans-text">
                                Advance (80%)
                              </span>
                              <span className="font-semibold text-foreground font-stack-sans-text">
                                {poolStats.advanceAmount} MNT
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-foreground/60 font-stack-sans-text">
                                Funding Progress
                              </span>
                              <span className="font-semibold text-primary font-stack-sans-text">
                                {poolStats.fundingProgress.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(poolStats.fundingProgress, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Tranches */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-foreground/5 border border-foreground/10">
                              <p className="text-xs text-foreground/60 mb-1 font-stack-sans-text">
                                Senior ROI
                              </p>
                              <p className="text-lg font-bold text-primary font-stack-sans-text">
                                {poolStats.seniorAPY.toFixed(1)}%
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-foreground/5 border border-foreground/10">
                              <p className="text-xs text-foreground/60 mb-1 font-stack-sans-text">
                                Junior ROI
                              </p>
                              <p className="text-lg font-bold text-primary font-stack-sans-text">
                                {poolStats.juniorAPY.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-full border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-stack-sans-text font-semibold"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-2 rounded-full font-semibold font-stack-sans-text text-sm transition-all duration-300 ${
                            currentPage === i + 1
                              ? "bg-primary text-background shadow-lg shadow-primary/20"
                              : "border border-foreground/20 bg-foreground/5 hover:bg-foreground/10"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-full border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-stack-sans-text font-semibold"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Information Section */}
          <div
            className="mt-24 p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 font-stack-sans-text text-primary">
                How Investment Works
              </h3>
              <p className="text-foreground/70" style={{ fontFamily: "var(--font-lato)" }}>
                Choose your risk level and investment strategy
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h4 className="font-bold text-lg font-stack-sans-text">Senior Tranche</h4>
                </div>
                <ul
                  className="space-y-2 text-sm text-foreground/70"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <span>Lower risk, stable returns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <span>First priority in payment waterfall</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <span>Ideal for conservative investors</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <h4 className="font-bold text-lg font-stack-sans-text">Junior Tranche</h4>
                </div>
                <ul
                  className="space-y-2 text-sm text-foreground/70"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <span>Higher risk, higher returns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <span>Second priority in payment waterfall</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary"></div>
                    <span>For aggressive growth investors</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
