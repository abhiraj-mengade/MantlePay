"use client";

import { useState } from "react";
import Link from "next/link";

type Tranche = {
  name: string;
  funded: number;
  target: number;
  apy: number;
};

type ReceivablePool = {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  maturityDate: Date;
  status: "active" | "funded" | "matured";
  seniorTranche: Tranche;
  juniorTranche: Tranche;
  receivableCount: number;
};

export default function Pools() {
  const [currentPage, setCurrentPage] = useState(1);
  const poolsPerPage = 6;

  // Mock pools data
  const mockPools: ReceivablePool[] = [
    {
      id: "1",
      name: "Receivables Pool Alpha",
      description: "High-quality short-term receivables with 30-60 day maturity",
      totalValue: 500000,
      maturityDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: "active",
      seniorTranche: {
        name: "Senior",
        funded: 300000,
        target: 400000,
        apy: 8.5,
      },
      juniorTranche: {
        name: "Junior",
        funded: 50000,
        target: 100000,
        apy: 14.5,
      },
      receivableCount: 45,
    },
    {
      id: "2",
      name: "Receivables Pool Beta",
      description: "Diversified portfolio with mixed maturity periods",
      totalValue: 750000,
      maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "active",
      seniorTranche: {
        name: "Senior",
        funded: 450000,
        target: 600000,
        apy: 9.0,
      },
      juniorTranche: {
        name: "Junior",
        funded: 100000,
        target: 150000,
        apy: 16.0,
      },
      receivableCount: 62,
    },
  ];

  const [pools] = useState<ReceivablePool[]>(mockPools);
  const [isLoading] = useState(false);

  const calculateStats = () => {
    const totalPools = pools.length;
    const totalValue = pools.reduce((sum, pool) => sum + pool.totalValue, 0);
    const totalFunded = pools.reduce(
      (sum, pool) => sum + pool.seniorTranche.funded + pool.juniorTranche.funded,
      0,
    );
    const avgAPY =
      pools.reduce((sum, pool) => sum + (pool.seniorTranche.apy + pool.juniorTranche.apy) / 2, 0) /
      pools.length;

    return {
      totalPools,
      totalValue,
      totalFunded,
      avgAPY: avgAPY.toFixed(1),
    };
  };

  const stats = calculateStats();

  const indexOfLastPool = currentPage * poolsPerPage;
  const indexOfFirstPool = indexOfLastPool - poolsPerPage;
  const currentPools = pools.slice(indexOfFirstPool, indexOfLastPool);
  const totalPages = Math.ceil(pools.length / poolsPerPage);

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
            <div className="p-6 rounded-xl border border-foreground/20 bg-foreground/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01]">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Total Pools
              </p>
              <p className="text-3xl font-bold text-primary font-stack-sans-text">
                {stats.totalPools}
              </p>
            </div>

            <div className="p-6 rounded-xl border border-foreground/20 bg-foreground/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01]">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Total Value
              </p>
              <p className="text-3xl font-bold text-foreground font-stack-sans-text">
                {(stats.totalValue / 1000).toFixed(0)}K MNT
              </p>
            </div>

            <div className="p-6 rounded-xl border border-foreground/20 bg-foreground/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01]">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Total Funded
              </p>
              <p className="text-3xl font-bold text-primary font-stack-sans-text">
                {(stats.totalFunded / 1000).toFixed(0)}K MNT
              </p>
            </div>

            <div className="p-6 rounded-xl border border-foreground/20 bg-foreground/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01]">
              <p className="text-xs text-foreground/60 uppercase tracking-wide mb-2 font-stack-sans-text">
                Avg APY
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
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {currentPools.map((pool, index) => {
                    const totalFunded = pool.seniorTranche.funded + pool.juniorTranche.funded;
                    const progress = (totalFunded / pool.totalValue) * 100;

                    return (
                      <Link
                        key={pool.id}
                        href={`/pools/${pool.id}`}
                        className="group block animate-fade-in"
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <div className="p-6 rounded-xl border border-foreground/20 bg-background/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 h-full">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-foreground font-stack-sans-text">
                              {pool.name}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold border font-stack-sans-text ${
                                pool.status === "active"
                                  ? "text-primary bg-primary/10 border-primary/30"
                                  : "text-foreground/60 bg-foreground/10 border-foreground/20"
                              }`}
                            >
                              {pool.status.toUpperCase()}
                            </span>
                          </div>

                          <p
                            className="text-sm text-foreground/60 mb-4"
                            style={{ fontFamily: "var(--font-lato)" }}
                          >
                            {pool.description}
                          </p>

                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/60 font-stack-sans-text">
                                Total Value
                              </span>
                              <span className="font-semibold text-primary font-stack-sans-text">
                                {pool.totalValue.toLocaleString()} MNT
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/60 font-stack-sans-text">
                                Receivables
                              </span>
                              <span className="font-semibold text-foreground font-stack-sans-text">
                                {pool.receivableCount}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground/60 font-stack-sans-text">
                                Maturity
                              </span>
                              <span className="font-semibold text-foreground font-stack-sans-text">
                                {pool.maturityDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
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
                                {progress.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Tranches */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-foreground/5 border border-foreground/10">
                              <p className="text-xs text-foreground/60 mb-1 font-stack-sans-text">
                                Senior APY
                              </p>
                              <p className="text-lg font-bold text-primary font-stack-sans-text">
                                {pool.seniorTranche.apy}%
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-foreground/5 border border-foreground/10">
                              <p className="text-xs text-foreground/60 mb-1 font-stack-sans-text">
                                Junior APY
                              </p>
                              <p className="text-lg font-bold text-primary font-stack-sans-text">
                                {pool.juniorTranche.apy}%
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
                      className="px-4 py-2 rounded-lg border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-stack-sans-text font-semibold"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-2 rounded-lg font-semibold font-stack-sans-text text-sm transition-all duration-300 ${
                            currentPage === i + 1
                              ? "bg-primary text-background"
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
                      className="px-4 py-2 rounded-lg border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-stack-sans-text font-semibold"
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
            className="mt-24 p-4 rounded-2xl border border-primary/20 bg-background/5 animate-fade-in"
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
              <div className="p-6 rounded-xl border border-foreground/20 bg-background hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
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

              <div className="p-6 rounded-xl border border-foreground/20 bg-background hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
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
