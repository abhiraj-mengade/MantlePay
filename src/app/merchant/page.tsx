"use client";

import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  useApproveNFT,
  useCreatePool,
  getReceiptNFTContract,
  getCascadeProtocolContract,
  findOwnedNFTs,
  useNextReceiptId,
} from "@/lib/hooks";
import { areContractsDeployed, CONTRACT_ADDRESSES, parseMNT } from "@/lib/contracts";
import { generateOrderQRCode, type QRCodeData } from "@/lib/sales-orders";
import type { SalesOrder } from "@/types/sales-order";

interface MerchantOrder extends SalesOrder {
  qrCode?: string;
}

interface PoolCreationForm {
  tokenId: string;
  receivableValue: string;
  investorReturn: string;
  seniorDiscBPS: string;
  juniorDiscBPS: string;
}

export default function Merchant() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [showPoolForm, setShowPoolForm] = useState(false);
  const [selectedNFTTokenId, setSelectedNFTTokenId] = useState<string | null>(null);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");
  const [ownedNFTs, setOwnedNFTs] = useState<bigint[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const account = useActiveAccount();

  const [poolForm, setPoolForm] = useState<PoolCreationForm>({
    tokenId: "",
    receivableValue: "",
    investorReturn: "",
    seniorDiscBPS: "100", // 1% default
    juniorDiscBPS: "1200", // 12% default
  });

  const [formData, setFormData] = useState({
    merchantId: "",
    dueDate: "",
    amount: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem("merchantOrders");
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        // Convert date strings back to Date objects
        const ordersWithDates = parsed.map((order: any) => ({
          ...order,
          createDate: new Date(order.createDate),
          dueDate: new Date(order.dueDate),
        }));
        setOrders(ordersWithDates);
      } catch (error) {
        console.error("Failed to load orders from localStorage:", error);
      }
    }
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem("merchantOrders", JSON.stringify(orders));
    }
  }, [orders]);

  // Match NFT token ID to order by checking which orders might correspond
  // Since NFTs are minted sequentially, we can estimate based on order creation time
  const findOrderForNFT = (tokenId: string): MerchantOrder | null => {
    const tokenIdNum = parseInt(tokenId);
    
    // Try to find order that matches:
    // 1. Orders with status "minted" first
    // 2. Then by creation order (assuming NFTs are minted in order)
    const mintedOrders = orders.filter(o => o.status === "minted");
    if (mintedOrders.length > 0 && tokenIdNum <= mintedOrders.length) {
      // If we have minted orders, assume they correspond sequentially
      const sortedMinted = mintedOrders.sort((a, b) => a.createDate.getTime() - b.createDate.getTime());
      return sortedMinted[tokenIdNum - 1] || null;
    }
    
    // Fallback: use most recent order with amount
    const recentOrder = orders
      .filter(order => order.amount > 0)
      .sort((a, b) => b.createDate.getTime() - a.createDate.getTime())[0];
    
    return recentOrder || null;
  };

  const contractsDeployed = areContractsDeployed();
  const receiptNFTContract = getReceiptNFTContract();
  const cascadeContract = getCascadeProtocolContract();

  const { approveNFT, isPending: isApproving } = useApproveNFT();
  const { createPool, isPending: isCreating } = useCreatePool();

  // Get pool count for tracking created pools
  const { data: poolCount, refetch: refetchPoolCount } = useReadContract({
    contract: cascadeContract,
    method: "poolCount" as const,
    params: [],
  });

  // Get next token ID
  const { data: nextId } = useNextReceiptId();

  // Load owned NFTs and update order status
  useEffect(() => {
    const loadNFTs = async () => {
      if (!account?.address) {
        setOwnedNFTs([]);
        return;
      }

      setIsLoadingNFTs(true);
      try {
        const nfts = await findOwnedNFTs(account.address, nextId);
        setOwnedNFTs(nfts);
        
        // Update order status to "minted" when corresponding NFT is detected
        // This ensures orders disappear from "Your Sales Orders" once NFT is minted
        setOrders(prevOrders => {
          const mintedOrderCount = prevOrders.filter(o => o.status === "minted").length;
          
          // If we have more NFTs than minted orders, mark the oldest pending/approved orders as minted
          if (nfts.length > mintedOrderCount) {
            const ordersToMint = nfts.length - mintedOrderCount;
            const pendingOrders = prevOrders
              .filter(o => o.status === "pending" || o.status === "approved" || o.status === "verified")
              .sort((a, b) => a.createDate.getTime() - b.createDate.getTime())
              .slice(0, ordersToMint);
            
            if (pendingOrders.length > 0) {
              const orderIdsToMint = new Set(pendingOrders.map(o => o.orderId));
              const updatedOrders = prevOrders.map(order => {
                if (orderIdsToMint.has(order.orderId) && order.status !== "minted") {
                  return { ...order, status: "minted" as const };
                }
                return order;
              });
              
              // Save to localStorage immediately to persist the change
              localStorage.setItem("merchantOrders", JSON.stringify(updatedOrders));
              return updatedOrders;
            }
          }
          
          return prevOrders;
        });
      } catch (error) {
        console.error("Failed to load NFTs:", error);
      } finally {
        setIsLoadingNFTs(false);
      }
    };

    // Load immediately
    loadNFTs();
    // Refresh every 5 seconds to catch new NFTs faster
    const interval = setInterval(loadNFTs, 5000);
    return () => clearInterval(interval);
  }, [account?.address, nextId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account?.address) {
      alert("Please connect your wallet first to generate QR code with your address");
      return;
    }

    const orderId = `SO-${String(orders.length + 1).padStart(3, "0")}`;
    const createDate = new Date();
    const dueDate = new Date(formData.dueDate);

    const newOrder: SalesOrder = {
      orderId,
      merchantId: formData.merchantId,
      amount: parseFloat(formData.amount),
      createDate,
      dueDate,
      status: "pending",
      customerAddress: account.address, // Store merchant address for QR
    };

    // Generate QR code with merchant address
    try {
      console.log("Generating QR code with merchant address:", account.address);
      const qrCode = await generateOrderQRCode(newOrder, account.address);
      
      // Extract QR data JSON string for parsing
      const qrData: QRCodeData = {
        orderId: newOrder.orderId,
        merchantId: newOrder.merchantId,
        merchantAddress: account.address,
        amount: newOrder.amount,
        dueDate: newOrder.dueDate.toISOString(),
        timestamp: newOrder.createDate.getTime(),
        protocol: "mantle-pay",
      };
      const qrDataString = JSON.stringify(qrData);

      const orderWithQR: MerchantOrder = {
        ...newOrder,
        qrCode,
        qrData: qrDataString,
      };
      setOrders([orderWithQR, ...orders]);
      setFormData({ merchantId: "", dueDate: "", amount: "" });
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePoolFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newForm = { ...poolForm, [e.target.name]: e.target.value };
    
    // Auto-calculate Investor Return (C) when Receivable Value or discounts change
  if (e.target.name === "receivableValue" || e.target.name === "seniorDiscBPS" || e.target.name === "juniorDiscBPS") {
    const receivableValue = parseFloat(newForm.receivableValue) || 0;
    const seniorDisc = parseInt(newForm.seniorDiscBPS || '0') / 10000; // dS
    const juniorDisc = parseInt(newForm.juniorDiscBPS || '0') / 10000; // dJ
    if (receivableValue > 0) {
      // Hedera flow formula:
      // A = 0.8 * R
      // C = A / ( s * (1 - dS) + j * (1 - dJ) )
      // where s = 0.75, j = 0.25
      const R = receivableValue;
      const A = 0.8 * R;
      const s = 0.75;
      const j = 0.25;
      const denom = s * (1 - seniorDisc) + j * (1 - juniorDisc);
      if (denom > 0) {
        const C = A / denom;
        newForm.investorReturn = C.toFixed(4);
      }
    }
  }
  
  setPoolForm(newForm);
  };

  // Calculate investor return C based on receivable value (R) and discounts
  const calculateInvestorReturn = (receivableValue: number, seniorDiscBPS: number, juniorDiscBPS: number): number => {
    if (receivableValue <= 0) return 0;
    const R = receivableValue;
    const A = 0.8 * R;
    const s = 0.75;
    const j = 0.25;
    const dS = seniorDiscBPS / 10000; // convert BPS to decimal
    const dJ = juniorDiscBPS / 10000;
    const denom = s * (1 - dS) + j * (1 - dJ);
    if (denom <= 0) return 0;
    const C = A / denom;
    return C;
  };

  const openPoolForm = (tokenId: string) => {
    setSelectedNFTTokenId(tokenId);
    
    // Find matching order for this NFT
    const matchingOrder = findOrderForNFT(tokenId);
    let receivableValue = "";
    
    if (matchingOrder) {
      receivableValue = matchingOrder.amount.toString();
    }
    
    // Default discounts: Senior 5% (500 BPS), Junior 12% (1200 BPS)
    const seniorDiscBPS = "500";
    const juniorDiscBPS = "1200";
    const investorReturn = receivableValue 
      ? calculateInvestorReturn(parseFloat(receivableValue), parseInt(seniorDiscBPS), parseInt(juniorDiscBPS)).toFixed(4)
      : "";
    
    setPoolForm({
      tokenId,
      receivableValue,
      investorReturn,
      seniorDiscBPS,
      juniorDiscBPS,
    });
    setShowPoolForm(true);
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    if (!selectedNFTTokenId) {
      alert("No NFT selected");
      return;
    }

    setIsCreatingPool(true);
    setTxStatus("pending");
    setTxMessage("Creating receivables pool...");

    try {
      // Validate inputs
      if (!poolForm.receivableValue || parseFloat(poolForm.receivableValue) <= 0) {
        alert("Receivable value (R) must be greater than 0. Please enter a valid amount.");
        setIsCreatingPool(false);
        return;
      }
      
      if (!poolForm.investorReturn || parseFloat(poolForm.investorReturn) <= 0) {
        alert("Investor return (C) must be greater than 0. It will be auto-calculated when you enter the receivable value.");
        setIsCreatingPool(false);
        return;
      }
      
      // Additional validation: ensure receivable value is reasonable
      const receivableValue = parseFloat(poolForm.receivableValue);
      if (receivableValue < 0.0001) {
        alert("Receivable value is too small. Minimum is 0.0001 MNT");
        setIsCreatingPool(false);
        return;
      }

      const tokenId = BigInt(selectedNFTTokenId);
      const receivableWei = parseMNT(poolForm.receivableValue);
      // poolForm.investorReturn holds C; contract expects only interest (C - A)
      const R = parseFloat(poolForm.receivableValue);
      const C = parseFloat(poolForm.investorReturn);
      const A = 0.8 * R;
      const interest = C - A;
      if (!isFinite(interest) || interest <= 0) {
        alert("Computed investor interest (C - 0.8R) must be > 0. Please check R, discounts, and C.");
        setIsCreatingPool(false);
        return;
      }
      const investorReturnWei = parseMNT(interest.toFixed(8));
      const seniorBPS = BigInt(poolForm.seniorDiscBPS);
      const juniorBPS = BigInt(poolForm.juniorDiscBPS);

      // Ensure values are not zero
      if (receivableWei === 0n || investorReturnWei === 0n) {
        alert("Values are too small. Please use at least 0.000001 MNT");
        setIsCreatingPool(false);
        return;
      }

      // Check if approval is needed
      try {
        const { readContract } = await import("thirdweb");
        const approvedAddress = (await readContract({
          contract: receiptNFTContract,
          method: "getApproved" as const,
          params: [tokenId],
        })) as string;

        if (approvedAddress.toLowerCase() !== CONTRACT_ADDRESSES.CASCADE_PROTOCOL.toLowerCase()) {
          // Approve first - wait for approval to complete
          await approveNFT(CONTRACT_ADDRESSES.CASCADE_PROTOCOL, tokenId);
          // Small delay to ensure approval is processed
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error("Error checking approval:", error);
        // Continue anyway - might work if owner is calling
      }

      await createPool(tokenId, receivableWei, investorReturnWei, seniorBPS, juniorBPS);

      setShowPoolForm(false);
      setSelectedNFTTokenId(null);
      refetchPoolCount();

      setTxStatus("success");
      setTxMessage(`Pool created successfully!`);

      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 3000);
    } catch (error: any) {
      console.error("Error creating pool:", error);
      setTxStatus("error");
      setTxMessage(error?.message || "Pool creation failed");
    } finally {
      setIsCreatingPool(false);
    }
  };

  // Filter out minted orders - they should only appear in "Your R-NFTs"
  const pendingOrders = orders.filter(order => order.status !== "minted");
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = pendingOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(pendingOrders.length / ordersPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-primary bg-primary/10 border-primary/30";
      case "pending":
        return "text-foreground/60 bg-foreground/10 border-foreground/20";
      case "rejected":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "minted":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-foreground/60 bg-foreground/10";
    }
  };

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
            Create and manage your sales orders with blockchain-powered security
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

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Create Sales Order Form */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground font-stack-sans-text">
                  Create Sales Order
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Merchant ID */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    name="merchantId"
                    value={formData.merchantId}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., MERCH-001"
                    className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                    Amount (MNT)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!account}
                  className="w-full px-6 py-3 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text disabled:opacity-50"
                >
                  Create Sales Order & Generate QR Code
                </button>
              </form>
            </div>
          </div>

          {/* Owned Receipt NFTs - Blockchain Source of Truth */}
          <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground font-stack-sans-text">
                  Your Receipt NFTs
                </h2>
                {isLoadingNFTs && (
                  <span className="text-xs text-foreground/50 font-stack-sans-text">
                    Refreshing...
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/50 mb-4 font-stack-sans-text">
                💡 <strong>Live from blockchain:</strong> NFTs appear here when customers scan your QR code on their device and approve orders. Updates every 10 seconds.
              </p>
              {!account ? (
                <p className="text-foreground/60 text-center py-8 font-stack-sans-text">
                  Connect your wallet to see your NFTs
                </p>
              ) : isLoadingNFTs ? (
                <p className="text-foreground/60 text-center py-8 font-stack-sans-text">
                  Loading NFTs from blockchain...
                </p>
              ) : ownedNFTs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-foreground/60 font-stack-sans-text mb-2">
                    No Receipt NFTs found.
                  </p>
                  <p className="text-sm text-foreground/50 font-stack-sans-text">
                    NFTs will appear here automatically after customers scan your QR code on their device and approve orders.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ownedNFTs.map((tokenId) => (
                    <div
                      key={tokenId.toString()}
                      className="flex items-center justify-between p-4 rounded-xl border border-foreground/10 bg-background/5 hover:border-primary/30 transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-foreground font-stack-sans-text">
                          Receipt NFT #{tokenId.toString()}
                        </span>
                        <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                          Ready to create pool
                        </p>
                      </div>
                      <button
                        onClick={() => openPoolForm(tokenId.toString())}
                        className="px-4 py-2 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] font-stack-sans-text text-sm"
                      >
                        Create Pool
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sales Orders List - Local Reference Only */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground font-stack-sans-text">
                  Your Sales Orders
                </h2>
              </div>
              <p className="text-xs text-foreground/50 mb-4 font-stack-sans-text">
                📋 <strong>Local reference:</strong> This list is for your convenience. Check "Your Receipt NFTs" above for blockchain-verified NFTs minted by customers on their devices.
              </p>

              {pendingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-foreground/60 font-stack-sans-text">
                    No orders yet. Create your first sales order to get started!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {currentOrders.map((order) => (
                      <div
                        key={order.orderId}
                        className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-foreground font-stack-sans-text">
                              {order.orderId}
                            </h3>
                            <p className="text-sm text-foreground/60 font-stack-sans-text">
                              Merchant: {order.merchantId}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border font-stack-sans-text ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </div>

                        {/* QR Code Display */}
                        {order.qrCode && (
                          <div className="mb-4 p-4 bg-background rounded-lg border border-foreground/20 flex items-center justify-center">
                            <img
                              src={order.qrCode}
                              alt="Order QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-foreground/60 text-xs mb-1 font-stack-sans-text">
                              Amount
                            </p>
                            <p className="font-semibold text-primary font-stack-sans-text">
                              {order.amount.toFixed(2)} MNT
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground/60 text-xs mb-1 font-stack-sans-text">
                              Due Date
                            </p>
                            <p className="font-semibold text-foreground font-stack-sans-text">
                              {order.dueDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {order.status === "minted" && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-xs text-foreground/80 mb-2 font-stack-sans-text">
                              ✅ Order approved by customer! Check "Your Receipt NFTs" section above to see the minted NFT and create a pool.
                            </p>
                            <p className="text-xs text-foreground/50 font-stack-sans-text">
                              Note: The NFT appears in your wallet on the blockchain. This status is just a local reference.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
                      <p className="text-sm text-foreground/60 font-stack-sans-text">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-full border border-foreground/20 bg-background text-foreground font-semibold transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-foreground/20 disabled:hover:bg-background font-stack-sans-text"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-full border border-foreground/20 bg-background text-foreground font-semibold transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-foreground/20 disabled:hover:bg-background font-stack-sans-text"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pool Creation Modal */}
      {showPoolForm && selectedNFTTokenId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-primary/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground font-stack-sans-text">
                Create Pool from NFT #{selectedNFTTokenId}
              </h2>
              <button
                onClick={() => {
                  setShowPoolForm(false);
                  setSelectedNFTTokenId(null);
                }}
                className="text-foreground/60 hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 font-stack-sans-text">
                  Receipt NFT Token ID
                </label>
                <input
                  type="text"
                  name="tokenId"
                  value={poolForm.tokenId}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-foreground/5 text-foreground/60 font-stack-sans-text"
                />
              </div>

              {/* Discount Fields - Moved to Top */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 font-stack-sans-text">
                    Senior Discount (BPS)
                  </label>
                  <input
                    type="number"
                    name="seniorDiscBPS"
                    value={poolForm.seniorDiscBPS}
                    onChange={handlePoolFormChange}
                    required
                    min="0"
                    placeholder="100 = 1%"
                    className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                  />
                  <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                    {(parseInt(poolForm.seniorDiscBPS) / 100 || 0).toFixed(2)}% discount
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 font-stack-sans-text">
                    Junior Discount (BPS)
                  </label>
                  <input
                    type="number"
                    name="juniorDiscBPS"
                    value={poolForm.juniorDiscBPS}
                    onChange={handlePoolFormChange}
                    required
                    min="0"
                    placeholder="1200 = 12%"
                    className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                  />
                  <p className="text-xs text-foreground/50 mt-1 font-stack-sans-text">
                    {(parseInt(poolForm.juniorDiscBPS) / 100 || 0).toFixed(2)}% discount
                  </p>
                </div>
              </div>

              {/* Investor Return - Highlighted, Auto-calculated */}
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
                <label className="block text-sm font-semibold text-primary mb-2 font-stack-sans-text">
                  Investor Return (C) - Auto-calculated
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="investorReturn"
                    value={poolForm.investorReturn}
                    onChange={handlePoolFormChange}
                    required
                    step="0.0001"
                    min="0"
                    placeholder="Total interest for investors"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-primary/50 bg-background text-primary font-bold placeholder:text-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                  />
                  <span className="text-2xl font-bold text-primary font-stack-sans-text">
                    {poolForm.investorReturn ? parseFloat(poolForm.investorReturn).toFixed(4) : "0.0000"} MNT
                  </span>
                </div>
              </div>

              {/* Receivable Value - Auto-populated from order */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 font-stack-sans-text">
                  Receivable Value (R) - From Order
                </label>
                <input
                  type="number"
                  name="receivableValue"
                  value={poolForm.receivableValue}
                  onChange={handlePoolFormChange}
                  required
                  step="0.0001"
                  min="0.0001"
                  placeholder="Total invoice value (auto-filled from order)"
                  className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                />
                {poolForm.receivableValue && (
                  <div className="mt-2 p-2 rounded bg-foreground/5 border border-foreground/10">
                    <p className="text-xs text-foreground/70 font-stack-sans-text">
                      ✅ Auto-filled from order. You&apos;ll receive 80% ({poolForm.receivableValue ? (parseFloat(poolForm.receivableValue) * 0.8).toFixed(4) : "0"} MNT) as advance
                    </p>
                  </div>
                )}
                {!poolForm.receivableValue && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-stack-sans-text">
                    ⚠️ No matching order found. Please enter the receivable value manually.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPoolForm(false);
                    setSelectedNFTTokenId(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground font-semibold transition-all duration-300 hover:bg-foreground/10 font-stack-sans-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPool || isCreating || !account}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed font-stack-sans-text"
                >
                  {isCreatingPool || isCreating ? "Creating Pool..." : "Create Pool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
