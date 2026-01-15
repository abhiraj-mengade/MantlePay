import type { Metadata } from "next";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { inter, lato, geist, outfit, comfortaa } from "@/utils/fonts";

export const metadata: Metadata = {
  title: "PayMantle",
  description: "Receivable financing reimagined on Mantle network",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geist.variable} ${outfit.variable} ${lato.variable} ${comfortaa.variable} bg-background text-foreground min-h-screen flex flex-col items-center`}
      >
        <ThirdwebProvider>
          <Header />
          <main className="min-h-screen w-full p-2">{children}</main>
          <Footer />
        </ThirdwebProvider>
      </body>
    </html>
  );
}
