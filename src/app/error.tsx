"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { BRANDING } from "@/config/branding";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("RedTeam Desk runtime error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)] font-sans">
      <div className="max-w-md w-full border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-8 shadow-xs space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[var(--rt-verdict-critical)] bg-[var(--rt-surface-base)] text-[var(--rt-verdict-critical)] font-mono font-bold text-lg">
          !
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold tracking-wider text-[var(--rt-text-muted)] uppercase">
            {BRANDING.SHORT_NAME} SYSTEM ERROR
          </span>
          <h2 className="text-xl font-mono font-bold tracking-tight text-[var(--rt-text-primary)]">
            Workbench Interruption
          </h2>
          <p className="text-xs font-mono text-[var(--rt-text-muted)] leading-relaxed">
            {error.message || "An unexpected error interrupted the risk analysis workbench."}
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="border border-[var(--rt-surface-void)] bg-[var(--rt-surface-void)] px-4 py-2 text-xs font-mono font-semibold text-[var(--rt-surface-raised)] hover:opacity-90 active:scale-[0.98] transition-opacity"
          >
            Retry operation
          </button>
          <Link
            href="/"
            className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] px-4 py-2 text-xs font-mono font-semibold text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-raised)] active:scale-[0.98] transition-colors"
          >
            Return to desk
          </Link>
        </div>
      </div>
    </div>
  );
}
