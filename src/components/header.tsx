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
    <header className="w-full p-2 flex bg-background/80 backdrop-blur-xl text-foreground sticky top-0 z-50 shadow-md border-b border-[#303030]/40">
      <nav className="flex justify-between items-center w-full p-1">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className="text-xl font-semibold font-stack-sans-text text-primary">
              Mantle<span className="text-foreground">Pay</span>
            </h1>
          </Link>
          <div className="hidden md:flex items-center gap-2 font-stack-sans-text">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                    isActive
                      ? "text-primary"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
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
              paddingLeft: "1.5rem",
              paddingRight: "1.5rem",
              paddingBottom: "0.5rem",
              paddingTop: "0.5rem",
            },
          }}
          client={client}
          appMetadata={{
            name: "Mantle Pay",
            url: "https://mantle-pay.com",
          }}
        />
      </nav>
    </header>
  );
}
