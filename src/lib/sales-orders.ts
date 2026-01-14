import type { SalesOrder } from "@/types/sales-order";

export interface QRCodeData {
  orderId: string;
  merchantId: string;
  merchantAddress?: string; // Merchant's wallet address
  amount: number;
  dueDate: string;
  timestamp: number;
  protocol: "mantle-pay";
}

export async function generateOrderQRCode(order: SalesOrder, merchantAddress?: string): Promise<string> {
  // Dynamic import to avoid SSR issues
  const QRCode = (await import("qrcode")).default;
  
  // Ensure merchant address is always included
  const finalMerchantAddress = merchantAddress || order.customerAddress;
  if (!finalMerchantAddress) {
    throw new Error("Merchant address is required to generate QR code. Please connect your wallet.");
  }
  
  const qrData: QRCodeData = {
    orderId: order.orderId,
    merchantId: order.merchantId,
    merchantAddress: finalMerchantAddress, // Always include merchant address for NFT minting
    amount: order.amount,
    dueDate: order.dueDate.toISOString(),
    timestamp: order.createDate.getTime(),
    protocol: "mantle-pay",
  };
  
  console.log("QR Code data generated:", { ...qrData, merchantAddress: finalMerchantAddress.slice(0, 10) + "..." });

  const jsonString = JSON.stringify(qrData);
  const qrCodeDataUrl = await QRCode.toDataURL(jsonString, {
    errorCorrectionLevel: "M",
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return qrCodeDataUrl;
}

export function parseQRCodeData(data: string): QRCodeData | null {
  try {
    const parsed = JSON.parse(data);
    if (
      parsed.orderId &&
      parsed.merchantId &&
      parsed.amount !== undefined &&
      parsed.protocol === "mantle-pay"
    ) {
      return parsed as QRCodeData;
    }
    return null;
  } catch {
    return null;
  }
}
