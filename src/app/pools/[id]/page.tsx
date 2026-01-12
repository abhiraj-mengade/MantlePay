"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, TrendingUp } from "lucide-react";

type Tranche = {
  name: string;
  funded: number;
  target: number;
  apy: number;
};

type Receivable = {
  tokenId: string;
  merchantId: string;
  amount: number;
  dueDate: Date;
  status: "active" | "paid" | "defaulted";
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
  receivables: Receivable[];
};

export default function PoolDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selectedTranche, setSelectedTranche] = useState<"senior" | "junior">("senior");
  const [investAmount, setInvestAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [animatedTotalValue, setAnimatedTotalValue] = useState(0);
  const [animatedTotalFunded, setAnimatedTotalFunded] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedReceivables, setAnimatedReceivables] = useState(0);
  const receivablesPerPage = 5;

  // Mock pool data
  const pool: ReceivablePool = useMemo(
    () => ({
      id,
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
      receivables: Array.from({ length: 45 }, (_, i) => ({
        tokenId: `REC-${String(i + 1).padStart(3, "0")}`,
        merchantId: `0x${Math.random().toString(16).slice(2, 10)}`,
        amount: Math.floor(Math.random() * 50000) + 5000,
        dueDate: new Date(Date.now() + (30 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000),
        status: "active",
      })),
    }),
    [id],
  );

  const totalFunded = pool.seniorTranche.funded + pool.juniorTranche.funded;
  const totalCapacity = pool.seniorTranche.target + pool.juniorTranche.target;
  const overallProgress = (totalFunded / totalCapacity) * 100;

  // Animate pool stats when pool loads
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepInterval = duration / steps;

    const totalFunded = pool.seniorTranche.funded + pool.juniorTranche.funded;
    const overallProgress = (totalFunded / pool.totalValue) * 100;

    // Animate Total Value
    const totalValueIncrement = pool.totalValue / steps;
    let totalValueStep = 0;
    const totalValueInterval = setInterval(() => {
      totalValueStep++;
      setAnimatedTotalValue(Math.min(totalValueIncrement * totalValueStep, pool.totalValue));
      if (totalValueStep >= steps) clearInterval(totalValueInterval);
    }, stepInterval);

    // Animate Total Funded
    const totalFundedIncrement = totalFunded / steps;
    let totalFundedStep = 0;
    const totalFundedInterval = setInterval(() => {
      totalFundedStep++;
      setAnimatedTotalFunded(Math.min(totalFundedIncrement * totalFundedStep, totalFunded));
      if (totalFundedStep >= steps) clearInterval(totalFundedInterval);
    }, stepInterval);

    // Animate Progress
    const progressIncrement = overallProgress / steps;
    let progressStep = 0;
    const progressInterval = setInterval(() => {
      progressStep++;
      setAnimatedProgress(Math.min(progressIncrement * progressStep, overallProgress));
      if (progressStep >= steps) clearInterval(progressInterval);
    }, stepInterval);

    // Animate Receivables Count
    const receivablesIncrement = pool.receivables.length / steps;
    let receivablesStep = 0;
    const receivablesInterval = setInterval(() => {
      receivablesStep++;
      setAnimatedReceivables(
        Math.min(receivablesIncrement * receivablesStep, pool.receivables.length),
      );
      if (receivablesStep >= steps) clearInterval(receivablesInterval);
    }, stepInterval);

    return () => {
      clearInterval(totalValueInterval);
      clearInterval(totalFundedInterval);
      clearInterval(progressInterval);
      clearInterval(receivablesInterval);
    };
  }, [pool]);

  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Investing ${investAmount} in ${selectedTranche} tranche`);
    setInvestAmount("");
  };

  const indexOfLastReceivable = currentPage * receivablesPerPage;
  const indexOfFirstReceivable = indexOfLastReceivable - receivablesPerPage;
  const currentReceivables = pool.receivables.slice(indexOfFirstReceivable, indexOfLastReceivable);
  const currentDate = new Date();

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
              {pool.name}
            </h1>
            <p
              className="text-xl text-foreground/70 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {pool.description}
            </p>
          </div>

          {/* Pool Overview */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="border border-primary/20 bg-background/5 rounded-xl p-6 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60 font-bold uppercase tracking-wide mb-2 font-stack-sans-text">
                    Total Value
                  </p>
                  <p className="text-3xl font-bold text-foreground font-stack-sans-text">
                    {Math.floor(animatedTotalValue).toLocaleString()} MNT
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
                    Total Funded
                  </p>
                  <p className="text-3xl font-bold text-primary font-stack-sans-text">
                    {Math.floor(animatedTotalFunded).toLocaleString()} MNT
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
                    Receivables
                  </p>
                  <p className="text-3xl font-bold text-foreground font-stack-sans-text">
                    {animatedReceivables}
                  </p>
                  <p className="text-xs text-foreground/60 mt-1 font-stack-sans-text">
                    Due: {pool.maturityDate.toLocaleDateString()}
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
                  Invest in Pool
                </h2>

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
                          {pool.seniorTranche.apy}% APY
                        </p>
                        <div className="pt-2 border-t border-foreground/10">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/60 font-stack-sans-text">
                              Progress
                            </span>
                            <span className="font-semibold text-foreground font-stack-sans-text">
                              {(
                                (pool.seniorTranche.funded / pool.seniorTranche.target) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${(pool.seniorTranche.funded / pool.seniorTranche.target) * 100}%`,
                              }}
                            ></div>
                          </div>
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
                          {pool.juniorTranche.apy}% APY
                        </p>
                        <div className="pt-2 border-t border-foreground/10">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground/60 font-stack-sans-text">
                              Progress
                            </span>
                            <span className="font-semibold text-foreground font-stack-sans-text">
                              {(
                                (pool.juniorTranche.funded / pool.juniorTranche.target) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-foreground/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${(pool.juniorTranche.funded / pool.juniorTranche.target) * 100}%`,
                              }}
                            ></div>
                          </div>
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
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] hover:brightness-110 font-stack-sans-text"
                  >
                    Invest in {selectedTranche === "senior" ? "Senior" : "Junior"} Tranche
                  </button>
                </form>
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
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/20 font-stack-sans-text">
                      {pool.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Maturity Date</span>
                    <span className="font-semibold text-foreground font-stack-sans-text">
                      {pool.maturityDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60 font-stack-sans-text">Total Capacity</span>
                    <span className="font-semibold text-primary font-stack-sans-text">
                      {totalCapacity.toLocaleString()} MNT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Receivables List */}
          <div
            className="p-6 rounded-xl border border-primary/20 bg-background/5 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <h2 className="text-2xl font-bold mb-6 text-foreground font-stack-sans-text">
              Pool Receivables
            </h2>

            <div className="space-y-4">
              {currentReceivables.map((receivable, index) => {
                const actualIndex = (currentPage - 1) * receivablesPerPage + index;
                const daysUntilDue = Math.ceil(
                  (receivable.dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
                );
                const isUrgent = daysUntilDue <= 7;

                return (
                  <div
                    key={receivable.tokenId}
                    className="border border-foreground/20 bg-background rounded-xl p-6 hover:border-primary/30 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-primary font-stack-sans-text">
                            {receivable.tokenId}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold border font-stack-sans-text ${
                              receivable.status === "active"
                                ? "text-primary bg-primary/10 border-primary/30"
                                : "text-foreground/60 bg-foreground/10 border-foreground/20"
                            }`}
                          >
                            {receivable.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60 font-stack-sans-text">
                          Merchant: {receivable.merchantId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary font-stack-sans-text">
                          {receivable.amount.toLocaleString()} MNT
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-foreground/60 mb-1 font-stack-sans-text">Due Date</p>
                        <p className="font-semibold text-foreground font-stack-sans-text">
                          {receivable.dueDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs font-semibold font-stack-sans-text ${
                            isUrgent ? "text-red-500" : "text-foreground/60"
                          }`}
                        >
                          {daysUntilDue} days until due
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-stack-sans-text font-semibold text-sm"
              >
                Previous
              </button>
              <div className="flex gap-2">
                {Array.from(
                  { length: Math.ceil(pool.receivables.length / receivablesPerPage) },
                  (_, i) => (
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
                  ),
                )}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(pool.receivables.length / receivablesPerPage)),
                  )
                }
                disabled={currentPage === Math.ceil(pool.receivables.length / receivablesPerPage)}
                className="px-4 py-2 rounded-lg border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-stack-sans-text font-semibold text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
