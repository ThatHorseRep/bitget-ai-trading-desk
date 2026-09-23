import React from "react";
import Link from "next/link";
import { BRANDING } from "@/config/branding";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)] font-sans">
      <div className="max-w-md w-full border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-8 shadow-xs space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] text-[var(--rt-text-muted)] font-mono font-bold text-lg">
          ?
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold tracking-wider text-[var(--rt-text-muted)] uppercase">
            404 • ROUTE NOT FOUND
          </span>
          <h2 className="text-xl font-mono font-bold tracking-tight text-[var(--rt-text-primary)]">
            Resource Outside Scope
          </h2>
          <p className="text-xs font-mono text-[var(--rt-text-muted)] leading-relaxed">
            The requested page or endpoint is not part of the {BRANDING.PRODUCT_NAME} workbench.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-[var(--rt-surface-void)] bg-[var(--rt-surface-void)] px-4 py-2 text-xs font-mono font-semibold text-[var(--rt-surface-raised)] hover:opacity-90 active:scale-[0.98] transition-opacity"
          >
            <span>Return to primary workbench</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
