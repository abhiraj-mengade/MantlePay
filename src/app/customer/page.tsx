"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { QRScanner, OrderVerification } from "@/components/consumer";
import { parseQRCodeData } from "@/lib/sales-orders";
import type { SalesOrder } from "@/types/sales-order";
import { areContractsDeployed } from "@/lib/contracts";

export default function CustomerPage() {
  const [scannedOrder, setScannedOrder] = useState<SalesOrder | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [approvedOrders, setApprovedOrders] = useState<SalesOrder[]>([]);

  const contractsDeployed = areContractsDeployed();
  const account = useActiveAccount();

  const handleOrderScanned = (orderData: string) => {
    try {
      const parsedData = parseQRCodeData(orderData);

      if (!parsedData) {
        alert("Invalid QR code format. Please scan a valid order QR code.");
        return;
      }

      // Create order from parsed QR data
      const order: SalesOrder = {
        orderId: parsedData.orderId,
        merchantId: parsedData.merchantId,
        amount: parsedData.amount,
        createDate: new Date(parsedData.timestamp || Date.now()),
        dueDate: new Date(parsedData.dueDate),
        status: "verified",
        qrCode: orderData, // Store the scanned data
        qrData: orderData, // Also store as qrData for parsing
        customerAddress: parsedData.merchantAddress, // Store merchant address for NFT minting
      };

      setScannedOrder(order);
      setIsScanning(false);
    } catch (error) {
      console.error("Invalid QR code data:", error);
      alert("Invalid QR code. Please scan a valid order QR code.");
    }
  };

  const handleOrderApproved = (order: SalesOrder) => {
    const approvedOrder = { ...order, status: "approved" as const };
    setApprovedOrders([approvedOrder, ...approvedOrders]);
    setScannedOrder(null);
  };

  const handleScanAnother = () => {
    setScannedOrder(null);
    setIsScanning(true);
  };

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
                Scan and approve merchant orders
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
              Scan and approve merchant orders
            </p>
          </div>

          {/* Scanner Section */}
          {!scannedOrder && !isScanning && (
            <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="p-12 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 text-center">
                <div className="text-6xl mb-6">📱</div>
                <h2 className="text-2xl font-bold mb-4 text-foreground font-stack-sans-text">
                  Ready to scan
                </h2>
                <p className="text-foreground/60 mb-8 font-stack-sans-text">
                  Scan the merchant&apos;s QR code to verify and approve orders
                </p>
                <button
                  onClick={() => setIsScanning(true)}
                  disabled={!account}
                  className="px-8 py-2 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start QR Scanner
                </button>
                {!account && (
                  <p className="text-sm text-foreground/60 mt-4 font-stack-sans-text">
                    Please connect your wallet to scan QR codes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Scanning in progress */}
          {isScanning && (
            <div className="mb-12 animate-fade-in">
              <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                <QRScanner onScanSuccess={handleOrderScanned} onCancel={() => setIsScanning(false)} />
              </div>
            </div>
          )}

          {/* Order Verification */}
          {scannedOrder && (
            <div className="mb-12 animate-fade-in">
              <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                <OrderVerification
                  order={scannedOrder}
                  onApprove={handleOrderApproved}
                  onReject={() => setScannedOrder(null)}
                  onScanAnother={handleScanAnother}
                />
              </div>
            </div>
          )}

          {/* Approved Orders History */}
          {approvedOrders.length > 0 && (
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
                <h3 className="text-lg font-bold mb-4 text-foreground font-stack-sans-text">
                  Your Recent Approvals
                </h3>
                <div className="space-y-3">
                  {approvedOrders.map((order, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground font-stack-sans-text">
                          {order.amount.toFixed(2)} MNT
                        </div>
                        <div className="text-xs text-foreground/50 font-stack-sans-text">
                          Merchant: {order.merchantId}
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/20 font-stack-sans-text">
                        ✓ Approved
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="text-center mb-12">
              <h3
                className="text-3xl font-bold text-foreground mb-3"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                How it works
              </h3>
              <p className="text-foreground/60 font-stack-sans-text">
                Four simple steps to approve orders
              </p>
            </div>

            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-8 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden md:block" />

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: 1,
                    title: "Scan QR Code",
                    description: "Scan the merchant's QR code",
                    icon: "📱",
                  },
                  {
                    step: 2,
                    title: "Review Details",
                    description: "Review the order details",
                    icon: "📋",
                  },
                  {
                    step: 3,
                    title: "Approve Order",
                    description: "Approve or reject the order",
                    icon: "✓",
                  },
                  {
                    step: 4,
                    title: "Confirmation",
                    description: "Wait for merchant confirmation",
                    icon: "✓",
                  },
                ].map((workflow, i) => (
                  <div
                    key={i}
                    className="group relative animate-fade-in"
                    style={{ animationDelay: `${i * 0.1 + 0.3}s` }}
                  >
                    <div className="relative p-6 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                      {/* Step Number */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary text-background text-sm font-stack-sans-text font-bold shadow-lg shadow-primary/30">
                          {workflow.step}
                        </div>
                        <div className="text-2xl text-primary/70">{workflow.icon}</div>
                      </div>

                      {/* Content */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
