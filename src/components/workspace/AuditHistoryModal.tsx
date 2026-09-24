"use client";

import React from "react";
import type { AuditHistoryEntry } from "@/lib/deskStorage";
import { VerdictGlyph } from "@/components/brand/VerdictGlyph";

interface AuditHistoryModalProps {
  isOpen: boolean;
  history: AuditHistoryEntry[];
  onSelectAudit: (entry: AuditHistoryEntry) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export function AuditHistoryModal({
  isOpen,
  history,
  onSelectAudit,
  onClearHistory,
  onClose
}: AuditHistoryModalProps) {
  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bitget-redteam-audit-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[var(--rtd-paper)] border-2 border-[var(--rtd-ink)] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-[var(--rtd-paper-subtle)] border-b border-[var(--rtd-steel)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[var(--rtd-ink)] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[var(--rtd-ink)] font-mono truncate">
                Institutional Audit Log
              </h2>
              <p className="text-[10.5px] sm:text-[11px] font-mono text-[var(--rtd-steel)]">
                {history.length} {history.length === 1 ? "persisted decision artifact" : "persisted decision artifacts"} in local memory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2.5 py-1 text-[10.5px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/40 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)] cursor-pointer shadow-2xs"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="px-2.5 py-1 text-[10.5px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border border-[var(--rtd-reject)] text-[var(--rtd-reject)] hover:bg-[var(--rtd-reject)] hover:text-white cursor-pointer shadow-2xs"
                >
                  Clear All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 cursor-pointer text-sm font-mono font-bold shrink-0"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Table (Desktop) / Cards (Mobile) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-3 min-w-0 max-w-full">
          {history.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper-subtle)]/50">
              <p className="text-sm font-mono font-semibold text-[var(--rtd-ink)]">
                No past audit artifacts recorded.
              </p>
              <p className="text-xs font-mono text-[var(--rtd-steel)] mt-1">
                Audits generated on the desk are automatically persisted across page refreshes.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (Zero horizontal scroll) */}
              <div className="sm:hidden space-y-2.5">
                {history.map((entry) => {
                  const verdictColor = 
                    entry.verdict === "PROCEED" ? "text-[var(--rtd-proceed)]" :
                    entry.verdict === "REJECT" ? "text-[var(--rtd-reject)]" :
                    entry.verdict === "WAIT" ? "text-[var(--rtd-wait)]" :
                    "text-[var(--rtd-reduce)]";

                  const timeFormatted = new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  });

                  return (
                    <div
                      key={entry.id}
                      onClick={() => onSelectAudit(entry)}
                      className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-3 space-y-2 cursor-pointer active:scale-[0.99] transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono border-b border-[var(--rtd-steel)]/15 pb-1.5">
                        <span className="font-bold text-[var(--rtd-ink)]">{entry.asset}</span>
                        <span className="text-[10px] text-[var(--rtd-steel)]">{timeFormatted}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider uppercase border ${
                            entry.direction === "LONG"
                              ? "bg-[var(--rtd-proceed)]/10 text-[var(--rtd-proceed)] border-[var(--rtd-proceed)]/30"
                              : "bg-[var(--rtd-reject)]/10 text-[var(--rtd-reject)] border-[var(--rtd-reject)]/30"
                          }`}>
                            {entry.direction}
                          </span>
                          <span className="font-bold text-[var(--rtd-ink)]">
                            ${entry.sizeUsd.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <VerdictGlyph verdict={entry.verdict} size={13} />
                          <span className={`font-bold tracking-wider text-[11px] ${verdictColor}`}>
                            {entry.verdict}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[var(--rtd-steel)]/10 text-[10.5px] font-mono">
                        <span className="text-[var(--rtd-steel)]">Score: {entry.compositeScore}/100</span>
                        <span className="text-[var(--rtd-proceed)] font-bold">Load Artifact →</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block border border-[var(--rtd-steel)]/30 overflow-x-auto max-w-full">
                <table className="w-full text-left text-xs font-mono border-collapse min-w-[580px]">
                  <thead>
                    <tr className="bg-[var(--rtd-paper-subtle)] border-b border-[var(--rtd-steel)]/30 text-[var(--rtd-steel)] text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Position</th>
                      <th className="py-2.5 px-3">Size (USD)</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Verdict</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rtd-steel)]/15">
                    {history.map((entry) => {
                      const verdictColor = 
                        entry.verdict === "PROCEED" ? "text-[var(--rtd-proceed)]" :
                        entry.verdict === "REJECT" ? "text-[var(--rtd-reject)]" :
                        entry.verdict === "WAIT" ? "text-[var(--rtd-wait)]" :
                        "text-[var(--rtd-reduce)]";

                      const timeFormatted = new Date(entry.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      });

                      return (
                        <tr 
                          key={entry.id} 
                          className="hover:bg-[var(--rtd-paper-subtle)] transition-colors group cursor-pointer"
                          onClick={() => onSelectAudit(entry)}
                        >
                          <td className="py-3 px-3 text-[11px] text-[var(--rtd-steel)]">
                            {timeFormatted}
                          </td>
                          <td className="py-3 px-3 font-bold text-[var(--rtd-ink)]">
                            {entry.asset}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${
                              entry.direction === "LONG"
                                ? "bg-[var(--rtd-proceed)]/10 text-[var(--rtd-proceed)] border-[var(--rtd-proceed)]/30"
                                : "bg-[var(--rtd-reject)]/10 text-[var(--rtd-reject)] border-[var(--rtd-reject)]/30"
                            }`}>
                              {entry.direction}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold tabular-nums text-[var(--rtd-ink)]">
                            ${entry.sizeUsd.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-bold text-[var(--rtd-ink)]">
                            {entry.compositeScore}/100
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <VerdictGlyph verdict={entry.verdict} size={14} />
                              <span className={`font-bold tracking-wider ${verdictColor}`}>
                                {entry.verdict}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAudit(entry);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--rtd-ink)] text-[var(--rtd-paper)] hover:opacity-90 cursor-pointer shadow-2xs"
                            >
                              Load Artifact →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-[var(--rtd-paper-subtle)] border-t border-[var(--rtd-steel)]/30 flex items-center justify-between text-[11px] font-mono text-[var(--rtd-steel)] shrink-0">
          <span className="truncate mr-2">Click any audit entry to load its complete decision sheet.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--rtd-steel)]/10 text-[var(--rtd-ink)] font-bold uppercase tracking-wider hover:bg-[var(--rtd-steel)]/20 cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
