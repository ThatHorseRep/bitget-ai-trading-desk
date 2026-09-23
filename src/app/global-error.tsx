"use client";

import React, { useEffect } from "react";
import { BRANDING } from "@/config/branding";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global runtime error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6 bg-[#0a0d12] text-[#f0f4f8] font-sans">
        <div className="max-w-md w-full border border-[#2a3441] bg-[#121820] p-8 shadow-xs space-y-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#ff4757] bg-[#0a0d12] text-[#ff4757] font-mono font-bold text-lg">
            !
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold tracking-wider text-[#8b9bb0] uppercase">
              {BRANDING.SHORT_NAME} CRITICAL SYSTEM ERROR
            </span>
            <h2 className="text-xl font-mono font-bold tracking-tight text-[#f0f4f8]">
              Application Error
            </h2>
            <p className="text-xs font-mono text-[#8b9bb0] leading-relaxed">
              {error.message || "An unexpected error occurred. Please restart the workbench."}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="border border-[#00f2fe] bg-[#00f2fe] px-4 py-2 text-xs font-mono font-semibold text-[#0a0d12] hover:opacity-90 active:scale-[0.98] transition-opacity cursor-pointer"
            >
              Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
