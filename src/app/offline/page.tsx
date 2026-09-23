import React from "react";
import Link from "next/link";
import { Lockup } from "@/components/brand/Logo";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[var(--rt-surface-inverse)] text-[var(--rt-text-inverse)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <Lockup height={40} reversed />
        </div>

        <div className="p-6 bg-[var(--rt-surface-inverse-raised)] border border-[var(--rt-border-inverse)] space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[var(--rt-verdict-critical)] text-white text-[10px] font-mono font-bold tracking-wider uppercase">
            OFFLINE MODE
          </div>

          <h1 className="text-2xl font-mono font-bold tracking-tight text-[var(--rt-text-inverse)]">
            Network Connection Unavailable
          </h1>

          <p className="text-sm text-[var(--rt-text-inverse-muted)] leading-relaxed">
            The Bitget AI RedTeam Desk requires network connectivity to stream live orderbook data and evaluate real-time basis spreads.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[var(--rt-text-inverse)] text-[var(--rt-surface-inverse)] text-xs font-mono font-bold uppercase tracking-wider hover:bg-white active:scale-95 transition-all"
            >
              RETRY CONNECTION →
            </Link>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[var(--rt-verdict-elevated)]">
          BITGET AI REDTEAM DESK • PRE-TRADE ADVERSARIAL FIREWALL
        </div>
      </div>
    </div>
  );
}
