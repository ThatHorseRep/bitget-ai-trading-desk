import React from "react";
import Link from "next/link";
import { Lockup } from "@/components/brand/Logo";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0E2436] text-[#EDEFEC] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <Lockup height={40} reversed />
        </div>

        <div className="p-6 bg-[#142A3C] border border-[#2B4459] space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#C8102E] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
            OFFLINE MODE
          </div>

          <h1 className="text-2xl font-mono font-bold tracking-tight text-[#EDEFEC]">
            Network Connection Unavailable
          </h1>

          <p className="text-sm text-[#9DB0BF] leading-relaxed">
            The Bitget AI RedTeam Desk requires network connectivity to stream live orderbook data and evaluate real-time basis spreads.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#EDEFEC] text-[#0E2436] text-xs font-mono font-bold uppercase tracking-wider hover:bg-white active:scale-95 transition-all"
            >
              RETRY CONNECTION →
            </Link>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#54697E]">
          BITGET AI REDTEAM DESK • PRE-TRADE ADVERSARIAL FIREWALL
        </div>
      </div>
    </div>
  );
}
