"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onCancel: () => void;
}

export function QRScanner({ onScanSuccess, onCancel }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isScanning && containerRef.current) {
      const html5QrCode = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = html5QrCode;
      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Successfully scanned
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent)
          },
        )
        .catch((err) => {
          setError("Failed to start camera. Please check permissions.");
          console.error("QR Scanner error:", err);
        });

      return () => {
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch(console.error);
        }
      };
    }
  }, [isScanning]);

  const handleScanSuccess = (data: string) => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
    onScanSuccess(data);
  };

  const startScanning = () => {
    setError(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
    }
  };

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <h2
          className="text-2xl font-bold mb-2 text-foreground"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          QR Code Scanner
        </h2>
        <p className="text-sm text-foreground/70 font-stack-sans-text">
          Position the QR code within the frame to scan
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg text-foreground text-sm font-stack-sans-text">
          {error}
        </div>
      )}

      {/* Camera view */}
      <div className="relative bg-background rounded-lg mb-6 overflow-hidden border border-foreground/20">
        <div id="qr-reader" ref={containerRef} className="w-full" style={{ minHeight: "300px" }} />
        {!isScanning && (
          <div className="absolute inset-0 bg-background flex items-center justify-center">
            <div className="text-foreground text-center">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-sm text-foreground/60 font-stack-sans-text">Camera not active</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-primary text-background hover:brightness-110 py-3 px-4 rounded-lg transition-all duration-300 font-semibold font-stack-sans-text hover:shadow-lg hover:shadow-primary/20"
          >
            Start Camera & Scan
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="w-full bg-foreground/20 hover:bg-foreground/30 text-foreground py-3 px-4 rounded-lg transition-all duration-300 font-semibold font-stack-sans-text border border-foreground/30"
          >
            Stop Scanning
          </button>
        )}

        {/* Manual input toggle */}
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full border border-foreground/20 hover:border-primary/40 hover:bg-primary/5 py-2 px-4 rounded-lg transition-all text-sm font-stack-sans-text text-foreground"
        >
          {showManualInput ? "Hide Manual Input" : "Enter Order Data Manually"}
        </button>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='Paste order data here (e.g., {"orderId":"ORD-123","merchantId":"MERCHANT-001","amount":100,"timestamp":1234567890,"protocol":"mantle-pay"})'
              className="w-full px-4 py-3 border border-foreground/20 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground h-24 text-sm font-mono transition-all"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full bg-primary text-background hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg transition-all duration-300 text-sm font-semibold font-stack-sans-text hover:shadow-lg hover:shadow-primary/20"
            >
              Process Order Data
            </button>
          </form>
        )}

        <button
          onClick={onCancel}
          className="w-full border border-foreground/20 hover:border-primary/40 hover:bg-primary/5 py-2 px-4 rounded-lg transition-all text-sm font-stack-sans-text text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
