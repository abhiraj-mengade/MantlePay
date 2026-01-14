export type SalesOrder = {
  orderId: string;
  merchantId: string;
  amount: number;
  createDate: Date;
  dueDate: Date;
  status: "pending" | "approved" | "rejected" | "minted" | "verified";
  qrCode?: string; // QR code image (data URL)
  qrData?: string; // QR code JSON data (for parsing)
  customerAddress?: string; // Merchant's wallet address (for NFT minting)
};
