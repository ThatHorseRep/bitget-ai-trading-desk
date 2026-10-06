"use client";

import React, { useState } from "react";
import type { DecisionArtifact } from "@/domain/decision/types";
import {
  processConversationalQuery,
  getSuggestedPrompts,
  type ConversationalReply,
  type SuggestedPrompt
} from "@/core/assistant/conversationalFollowup";
import { MessageSquare, Send, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface ConversationalDeskAssistantProps {
  artifact: DecisionArtifact;
  onSelectProvenance?: (recordId: string) => void;
  onOpenProvenance?: () => void;
}

export function ConversationalDeskAssistant({
  artifact,
  onSelectProvenance,
  onOpenProvenance
}: ConversationalDeskAssistantProps) {
  const [messages, setMessages] = useState<ConversationalReply[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestedPrompts = getSuggestedPrompts(artifact);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    setIsLoading(true);
    setInputQuery("");

    try {
      const reply = await processConversationalQuery(artifact, queryText);
      setMessages((prev) => [...prev, reply]);
    } catch {
      const fallbackReply: ConversationalReply = {
        id: `err-${Date.now()}`,
        timestamp: Date.now(),
        query: queryText,
        replyType: "grounded_synthesis",
        content: "Desk was unable to process query against current artifact. Please verify trade inputs or select a suggested prompt.",
        referencedProvenanceIds: []
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--rtd-steel)]/15 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] rounded-xs">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-mono font-bold text-[var(--rtd-ink)] flex items-center gap-2">
              <span>Ask RedTeam Desk</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--rtd-ink)]/10 text-[var(--rtd-ink)] font-bold rounded-xs tracking-wider uppercase">
                LUI Fluent
              </span>
            </h3>
            <p className="text-[11px] font-sans text-[var(--rtd-steel)]">
              Multi-turn conversational stress testing &amp; parameter exploration anchored to deterministic provenance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--rtd-steel)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--rtd-proceed)]" />
          <span>Zero Hallucination Guard</span>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--rtd-steel)] flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Suggested Exploration Queries</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((sug: SuggestedPrompt) => (
            <button
              key={sug.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(sug.prompt)}
              className="text-left px-2.5 py-1.5 bg-[var(--rtd-paper-subtle)] hover:bg-[var(--rtd-ink)]/5 border border-[var(--rtd-steel)]/20 hover:border-[var(--rtd-ink)] text-xs font-mono text-[var(--rtd-ink)] transition-all cursor-pointer rounded-xs flex items-center gap-1.5 group disabled:opacity-50"
            >
              <span>{sug.label}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Message History */}
      {messages.length > 0 && (
        <div className="space-y-3 pt-2 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3.5 sm:p-4 rounded-xs space-y-2.5"
            >
              {/* User Query Question */}
              <div className="flex items-start justify-between gap-2 border-b border-[var(--rtd-steel)]/10 pb-2">
                <span className="text-xs font-mono font-bold text-[var(--rtd-ink)]">
                  Q: {msg.query}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] rounded-xs shrink-0">
                  {msg.replyType.replace("_", " ")}
                </span>
              </div>

              {/* Calculated Metric Highlight (if applicable) */}
              {msg.calculatedMetric && (
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 rounded-xs text-center font-mono">
                  <div>
                    <div className="text-[9.5px] text-[var(--rtd-steel)] uppercase">Metric</div>
                    <div className="text-xs font-bold text-[var(--rtd-ink)]">{msg.calculatedMetric.label}</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-[var(--rtd-steel)] uppercase">Baseline / Proj</div>
                    <div className="text-xs font-bold text-[var(--rtd-ink)]">
                      {msg.calculatedMetric.originalValue} → {msg.calculatedMetric.projectedValue}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-[var(--rtd-steel)] uppercase">Net Delta</div>
                    <div className="text-xs font-bold text-[var(--rtd-reject)]">
                      {msg.calculatedMetric.impact}
                    </div>
                  </div>
                </div>
              )}

              {/* Reply Body */}
              <div className="text-xs font-sans text-[var(--rtd-ink)] leading-relaxed whitespace-pre-line">
                {msg.content}
              </div>

              {/* Referenced Provenance Chips */}
              {msg.referencedProvenanceIds && msg.referencedProvenanceIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--rtd-steel)]/10 text-[10px] font-mono">
                  <span className="text-[var(--rtd-steel)]">Provenanced By:</span>
                  {msg.referencedProvenanceIds.map((provId) => (
                    <button
                      key={provId}
                      type="button"
                      onClick={() => {
                        if (onSelectProvenance) onSelectProvenance(provId);
                        else if (onOpenProvenance) onOpenProvenance();
                      }}
                      className="px-1.5 py-0.5 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/30 hover:border-[var(--rtd-ink)] text-[var(--rtd-ink)] hover:underline cursor-pointer rounded-xs"
                    >
                      #{provId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="flex items-center gap-2 pt-2 border-t border-[var(--rtd-steel)]/15"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a follow-up (e.g. 'What if BTC drops 12%?', 'Explain why basis is high')..."
          disabled={isLoading}
          className="flex-1 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/30 px-3 py-2 text-xs font-mono text-[var(--rtd-ink)] placeholder:text-[var(--rtd-steel)]/70 focus:outline-hidden focus:border-[var(--rtd-ink)] rounded-xs"
        />

        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <span>Computing...</span>
          ) : (
            <>
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </>
          )}
        </button>
      </form>
    </section>
  );
}
