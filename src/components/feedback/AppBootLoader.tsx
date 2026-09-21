"use client";

import React from "react";
import { BRANDING } from "@/config/branding";

interface AppBootLoaderProps {
  statusText?: string;
}

export function AppBootLoader({
  statusText = "Initializing Red Team Risk Workbench..."
}: AppBootLoaderProps) {
  return (
    <div
      className="min-h-screen bg-[var(--rt-surface-base)] flex items-center justify-center p-6 text-[var(--rt-text-primary)]"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-8 shadow-xs space-y-6">
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-[var(--rt-border-subtle)] pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt={BRANDING.PRODUCT_NAME}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div>
            <h1 className="text-base font-mono font-bold text-[var(--rt-text-primary)]">
              {BRANDING.PRODUCT_NAME}
            </h1>
            <p className="text-xs font-mono text-[var(--rt-text-muted)]">
              {BRANDING.TAGLINE}
            </p>
          </div>
        </div>

        {/* Boot Status & Spinner */}
        <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[var(--rt-text-muted)]">
            <span>SUBSYSTEM</span>
            <span>STATUS</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Bitget API Gateway</span>
            <span className="text-[var(--rt-verdict-clear)]">READY</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Deterministic Policy Matrix</span>
            <span className="text-[var(--rt-verdict-clear)]">LOADED</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Audit &amp; Provenance Chain</span>
            <span className="text-[var(--rt-verdict-clear)]">ONLINE</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
            <span>{statusText}</span>
            <span className="motion-safe:animate-pulse motion-reduce:animate-none">●</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] overflow-hidden">
            <div className="h-full bg-[var(--rt-surface-void)] w-2/3 motion-safe:animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
