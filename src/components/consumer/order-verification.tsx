"use client";

import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { Loader2 } from "lucide-react";
import type { SalesOrder } from "@/types/sales-order";
import { getReceiptNFTContract } from "@/lib/hooks";
import { CONTRACT_ADDRESSES, parseMNT } from "@/lib/contracts";

interface OrderVerificationProps {
  order: SalesOrder;
  onApprove: (order: SalesOrder) => void;
  onReject: () => void;
  onScanAnother: () => void;
}

export function OrderVerification({
  order,
  onApprove,
  onReject,
  onScanAnother,
}: OrderVerificationProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState("");
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const receiptNFTContract = getReceiptNFTContract();

  const handleApprove = async () => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    // Get merchant address from QR code data
    let merchantAddress = order.customerAddress;
    if (!merchantAddress && order.qrData) {
      try {
        const qrData = JSON.parse(order.qrData);
        merchantAddress = qrData.merchantAddress;
      } catch (e) {
        console.error("Error parsing QR data:", e);
      }
    }
    // Fallback: try parsing from qrCode if qrData not available
    if (!merchantAddress && order.qrCode && !order.qrCode.startsWith("data:image")) {
      try {
        const qrData = JSON.parse(order.qrCode);
        merchantAddress = qrData.merchantAddress;
      } catch (e) {
        console.error("Error parsing QR code:", e);
      }
    }

    if (!merchantAddress) {
      alert("Error: Merchant address not found in QR code. Please ask the merchant to regenerate the QR code with their wallet connected.");
      return;
    }

    setIsMinting(true);
    setTxStatus("pending");
    setTxMessage("Minting Receipt NFT...");

    try {
      // Mint NFT to merchant address (the one who created the order)
      const mintCall = prepareContractCall({
        contract: receiptNFTContract,
        method: "mint" as const,
        params: [merchantAddress as `0x${string}`],
      });

      sendTx(mintCall, {
        onSuccess: (result) => {
          console.log("NFT minted successfully:", result);
          setTxStatus("success");
          setTxMessage("Receipt NFT minted successfully to merchant's wallet!");
          
          // Update order status
          const approvedOrder = { ...order, status: "minted" as const };
          onApprove(approvedOrder);
          
          setTimeout(() => {
            setIsMinting(false);
            setTxStatus("idle");
            setTxMessage("");
          }, 3000);
        },
        onError: (error: any) => {
          console.error("Failed to mint NFT:", error);
          setTxStatus("error");
          setTxMessage(error?.message || "Failed to mint NFT");
          setIsMinting(false);
          
          setTimeout(() => {
            setTxStatus("idle");
            setTxMessage("");
          }, 5000);
        },
      });
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      setTxStatus("error");
      setTxMessage(error?.message || "Failed to mint NFT");
      setIsMinting(false);
      
      setTimeout(() => {
        setTxStatus("idle");
        setTxMessage("");
      }, 5000);
    }
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">📋</div>
        <h2
          className="text-2xl font-bold mb-3 text-foreground"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          Order Verification
        </h2>
        <div className="inline-block px-4 py-2 rounded-full text-sm font-bold border font-stack-sans-text text-foreground/60 bg-foreground/10 border-foreground/20">
          PENDING APPROVAL
        </div>
      </div>

      {/* Transaction Status */}
      {txStatus !== "idle" && (
        <div
          className={`mb-6 p-4 rounded-xl border animate-fade-in ${
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

      <div className="bg-foreground/5 border border-foreground/15 rounded-2xl p-6 mb-6 ring-1 ring-foreground/5">
        <h3 className="font-bold text-lg mb-4 text-foreground font-stack-sans-text">
          Order Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-foreground/60 font-stack-sans-text">Order ID</span>
            <span className="font-semibold text-foreground font-stack-sans-text">{order.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60 font-stack-sans-text">Merchant</span>
            <span className="font-semibold text-foreground font-stack-sans-text">
              {order.merchantId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60 font-stack-sans-text">Amount</span>
            <span className="font-bold text-primary font-stack-sans-text text-xl">
              {order.amount.toFixed(2)} MNT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60 font-stack-sans-text">Due Date</span>
            <span className="font-semibold text-foreground font-stack-sans-text">
              {order.dueDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onReject}
          disabled={isMinting || isPending}
          className="flex-1 px-6 py-3 rounded-full border border-red-500/30 text-red-500 font-semibold transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/50 font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={isMinting || isPending || !account}
          className="flex-1 px-6 py-3 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isMinting || isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Minting NFT...
            </>
          ) : (
            "Approve & Mint NFT"
          )}
        </button>
      </div>

      <button
        onClick={onScanAnother}
        className="w-full mt-4 px-6 py-3 rounded-full border border-primary/30 text-primary font-semibold transition-all duration-300 hover:bg-primary/10 font-stack-sans-text"
      >
        📱 Scan Another Order
      </button>
    </div>
  );
}
