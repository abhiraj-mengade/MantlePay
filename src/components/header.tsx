"use client";

import Link from "next/link";
import { ConnectButton, darkTheme } from "thirdweb/react";
import { client } from "@/app/client";
import { usePathname } from "next/navigation";
import { defineChain } from "thirdweb/chains";

const mantle = defineChain(5003);

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/merchant", label: "Merchant" },
    { href: "/customer", label: "Customer" },
    { href: "/pools", label: "Pools" },
  ];
  return (
    <header className="w-full flex bg-background/60 backdrop-blur-2xl text-foreground sticky top-0 z-50 border-b border-primary/10">
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

      <nav className="flex justify-between items-center w-full px-8 py-4 container mx-auto">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group relative">
            {/* Logo with glow effect */}
            <div className="relative">
              <h1 className="text-2xl font-bold font-comfortaa tracking-tight">
                <span className="text-primary relative">
                  Mantle
                  <div className="absolute inset-0 blur-xl bg-primary/30 -z-10 group-hover:bg-primary/50 transition-all duration-500"></div>
                </span>
                <span className="text-foreground">Pay</span>
              </h1>
            </div>
          </Link>

          {/* Navigation with modern pill design */}
          <div className="hidden md:flex items-center gap-1 bg-foreground/5 rounded-full p-1 border border-foreground/10">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-5 py-2 rounded-full transition-all duration-300 font-medium font-outfit text-sm ${
                    isActive ? "text-background" : "text-foreground/70 hover:text-foreground/90"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/30 -z-10"></div>
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Connect button with enhanced styling */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
          <ConnectButton
            theme={darkTheme({
              colors: {
                primaryButtonBg: "#00e59b",
                primaryButtonText: "hsl(270, 5.6%, 7.1%)",
              },
            })}
            connectButton={{
              style: {
                fontSize: "0.875rem",
                fontWeight: "600",
                paddingLeft: "1.75rem",
                paddingRight: "1.75rem",
                paddingBottom: "0.625rem",
                paddingTop: "0.625rem",
                borderRadius: "9999px",
                fontFamily: "var(--font-lato)",
              },
            }}
            client={client}
            appMetadata={{
              name: "Mantle Pay",
              url: "https://mantle-pay.com",
            }}
          />
        </div>
      </nav>
    </header>
  );
}
