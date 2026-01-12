"use client";

import { useState } from "react";

type SalesOrder = {
  id: string;
  merchantId: string;
  customerId: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "minted";
  orderDate: Date;
  dueDate: Date;
  description: string;
};

export default function Merchant() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder: SalesOrder = {
      id: `SO-${String(orders.length + 1).padStart(3, "0")}`,
      merchantId: "0x1234...5678",
      customerId,
      amount: parseFloat(amount),
      status: "pending",
      orderDate: new Date(),
      dueDate: new Date(dueDate),
      description,
    };

    setOrders([newOrder, ...orders]);
    setCustomerId("");
    setAmount("");
    setDescription("");
    setDueDate("");
    setShowForm(false);
  };

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

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

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

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Create Sales Order Form */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground font-stack-sans-text">
                  Create Sales Order
                </h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-5 py-2.5 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text"
                >
                  {showForm ? "Cancel" : "+ New Order"}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Customer ID */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                      Customer ID / Wallet Address
                    </label>
                    <input
                      type="text"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                      placeholder="0x..."
                      className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                      Order Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      placeholder="Product or service description"
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
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-foreground/20 bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-stack-sans-text"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground font-stack-sans-text">
                      Amount (MNT)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
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
                    className="w-full px-6 py-3 rounded-full bg-primary text-background font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] font-stack-sans-text"
                  >
                    Create Sales Order
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sales Orders List */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5">
              <h2 className="text-xl font-bold mb-6 text-foreground font-stack-sans-text">
                Your Sales Orders
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-foreground/60 font-stack-sans-text">
                    No orders yet. Create your first sales order to get started!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {currentOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl border border-foreground/15 bg-background/10 ring-1 ring-foreground/5 hover:ring-primary/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-foreground font-stack-sans-text">
                              {order.id}
                            </h3>
                            <p className="text-sm text-foreground/60 font-stack-sans-text">
                              {order.description}
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

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-foreground/60 text-xs mb-1 font-stack-sans-text">
                              Customer
                            </p>
                            <p className="font-semibold text-foreground font-stack-sans-text">
                              {order.customerId.slice(0, 10)}...
                            </p>
                          </div>
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
                              Order Date
                            </p>
                            <p className="font-semibold text-foreground font-stack-sans-text">
                              {order.orderDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
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
                      </div>
                    ))}

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
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
