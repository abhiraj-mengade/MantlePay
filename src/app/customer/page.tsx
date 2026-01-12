"use client";

import { useState } from "react";

type SalesOrder = {
  id: string;
  merchantId: string;
  amount: number;
  description: string;
  dueDate: Date;
  status: "pending" | "approved" | "rejected";
};

export default function CustomerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<SalesOrder | null>(null);
  const [approvedOrders, setApprovedOrders] = useState<SalesOrder[]>([]);

  // Simulate QR scanning
  const simulateScan = () => {
    const mockOrder: SalesOrder = {
      id: `SO-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
      merchantId: "0x1234...5678",
      amount: Math.floor(Math.random() * 10000) + 100,
      description: "Sample Order - Electronic Components",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "pending",
    };
    setScannedOrder(mockOrder);
    setIsScanning(false);
  };

  const handleApprove = () => {
    if (scannedOrder) {
      const approvedOrder = { ...scannedOrder, status: "approved" as const };
      setApprovedOrders([approvedOrder, ...approvedOrders]);
      setScannedOrder(null);
    }
  };

  const handleReject = () => {
    if (scannedOrder) {
      setScannedOrder(null);
    }
  };

  const handleScanAnother = () => {
    setScannedOrder(null);
    setIsScanning(true);
  };

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
              <div className="p-12 rounded-xl border border-primary/20 bg-background/5 text-center">
                <div className="text-6xl mb-6">📱</div>
                <h2 className="text-2xl font-bold mb-4 text-foreground font-stack-sans-text">
                  Ready to scan
                </h2>
                <p className="text-foreground/60 mb-8 font-stack-sans-text">
                  Scan the merchant&apos;s QR code to verify and approve orders
                </p>
                <button
                  onClick={() => {
                    setIsScanning(true);
                    setTimeout(simulateScan, 2000);
                  }}
                  className="px-8 py-2 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] hover:brightness-110 font-stack-sans-text text-lg"
                >
                  Start QR Scanner
                </button>
              </div>
            </div>
          )}

          {/* Scanning in progress */}
          {isScanning && (
            <div className="mb-12 animate-fade-in">
              <div className="p-12 rounded-xl border border-primary/20 bg-background/5 text-center">
                <div className="animate-pulse text-6xl mb-6">📷</div>
                <h2 className="text-2xl font-bold mb-4 text-foreground font-stack-sans-text">
                  Scanning...
                </h2>
                <p className="text-foreground/60 font-stack-sans-text">
                  Point your camera at the QR code
                </p>
              </div>
            </div>
          )}

          {/* Order Verification */}
          {scannedOrder && (
            <div className="mb-12 animate-fade-in">
              <div className="p-8 rounded-xl border border-primary/20 bg-background/5">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">📋</div>
                  <h2
                    className="text-2xl font-bold mb-3 text-foreground"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    Order Verification
                  </h2>
                  <div
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold border font-stack-sans-text text-foreground/60 bg-foreground/10 border-foreground/20`}
                  >
                    PENDING APPROVAL
                  </div>
                </div>

                <div className="bg-foreground/5 border border-foreground/20 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4 text-foreground font-stack-sans-text">
                    Order Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-foreground/60 font-stack-sans-text">Order ID</span>
                      <span className="font-semibold text-foreground font-stack-sans-text">
                        {scannedOrder.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60 font-stack-sans-text">Merchant</span>
                      <span className="font-semibold text-foreground font-stack-sans-text">
                        {scannedOrder.merchantId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60 font-stack-sans-text">Description</span>
                      <span className="font-semibold text-foreground font-stack-sans-text">
                        {scannedOrder.description}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60 font-stack-sans-text">Amount</span>
                      <span className="font-bold text-primary font-stack-sans-text text-xl">
                        {scannedOrder.amount.toFixed(2)} MNT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60 font-stack-sans-text">Due Date</span>
                      <span className="font-semibold text-foreground font-stack-sans-text">
                        {scannedOrder.dueDate.toLocaleDateString("en-US", {
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
                    onClick={handleReject}
                    className="flex-1 px-6 py-3 rounded-lg border border-red-500/30 text-red-500 font-semibold transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/50 font-stack-sans-text"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] hover:brightness-110 font-stack-sans-text"
                  >
                    Approve Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Approved Orders History */}
          {approvedOrders.length > 0 && (
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="p-6 rounded-xl border border-primary/20 bg-background/5">
                <h3 className="text-lg font-bold mb-4 text-foreground font-stack-sans-text">
                  Your Recent Approvals
                </h3>
                <div className="space-y-3">
                  {approvedOrders.map((order, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-foreground/20 bg-background hover:border-primary/40 transition-all duration-300 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground font-stack-sans-text">
                          {order.amount.toFixed(2)} MNT
                        </div>
                        <div className="text-xs text-foreground/50 font-stack-sans-text">
                          Merchant: {order.merchantId.slice(0, 8)}...
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
              <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden md:block" />

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
                    <div className="relative p-6 rounded-xl border border-foreground/20 bg-background/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                      {/* Step Number */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-background text-sm font-stack-sans-text font-bold">
                          {workflow.step}
                        </div>
                        <div className="text-2xl text-primary/60">{workflow.icon}</div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-medium mb-2 text-foreground font-stack-sans-text">
                        {workflow.title}
                      </h3>
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
