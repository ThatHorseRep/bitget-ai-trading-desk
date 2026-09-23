"use client";

import React from "react";
import Link from "next/link";
import { Mark } from "@/components/brand/Logo";
import { BRANDING, COLOR } from "@/config/branding";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[var(--rtd-proof)] text-[var(--rtd-ink)] flex flex-col items-center justify-center p-6 selection:bg-[var(--rtd-ink)] selection:text-[var(--rtd-paper)]">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Centered Mark at small size with neutral colors (no red) */}
        <div className="flex justify-center" aria-hidden="true">
          <Mark
            size={32}
            body={COLOR.ink}
            fault={COLOR.steel}
            title={BRANDING.SHORT_NAME}
          />
        </div>

        {/* Product Name (mono) and calm offline message (sans) */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--rtd-steel)]">
            {BRANDING.PRODUCT_NAME}
          </div>
          <p className="text-base font-sans text-[var(--rtd-ink)] leading-relaxed">
            You&apos;re offline. Reconnect to keep stress-testing.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="w-full sm:w-auto min-h-[44px] px-8 py-3 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold tracking-wider uppercase hover:bg-[var(--rtd-void)] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
          >
            Reconnect
          </button>
        </div>

        {/* Closing fault rule below the text block */}
        <div className="pt-4">
          <div className="rtd-fault" aria-hidden="true" />
        </div>

        {/* Footnote */}
        <div className="text-[11px] font-mono text-[var(--rtd-steel)] uppercase tracking-wider">
          OFFLINE CACHE ACTIVE • RECONNECT FOR LIVE ORDERBOOK BASIS
        </div>
      </div>
    </main>
  );
}
