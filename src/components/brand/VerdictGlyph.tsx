"use client";

import { Mark } from "./Logo";
import { VERDICT_COLOR, VERDICT_OFFSET, COLOR, type Verdict } from "@/config/branding";

/**
 * The verdict glyph is the logo at a different displacement. PROCEED sits at
 * zero — the token is whole. REJECT sits at 15u — the two halves have clearly
 * parted. The reader learns the scale from the product, and then the logo
 * itself tells them something.
 *
 * Drop this in wherever `Decision.verdict` is currently rendered as text,
 * e.g. DecisionArtifactView.
 */
export function VerdictGlyph({
  verdict,
  size = 64,
  reversed = false,
}: {
  verdict: Verdict;
  size?: number;
  reversed?: boolean;
}) {
  const faultColor =
    verdict === "PROCEED"
      ? "var(--rtd-proceed)"
      : verdict === "REDUCE"
      ? "var(--rtd-reduce)"
      : verdict === "WAIT"
      ? "var(--rtd-wait)"
      : "var(--rtd-reject)";

  return (
    <Mark
      size={size}
      body={reversed ? "var(--rtd-proof)" : "var(--rtd-ink)"}
      fault={faultColor}
      offset={VERDICT_OFFSET[verdict]}
      title={`Verdict: ${verdict}`}
    />
  );
}

export function VerdictBadge({
  verdict,
  reversed = false,
}: {
  verdict: Verdict;
  reversed?: boolean;
}) {
  const verdictColor =
    verdict === "PROCEED"
      ? "var(--rtd-proceed)"
      : verdict === "REDUCE"
      ? "var(--rtd-reduce)"
      : verdict === "WAIT"
      ? "var(--rtd-wait)"
      : "var(--rtd-reject)";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <VerdictGlyph verdict={verdict} size={28} reversed={reversed} />
      <span
        style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontWeight: 620,
          letterSpacing: "0.14em",
          fontSize: 14,
          color: verdictColor,
        }}
      >
        {verdict}
      </span>
    </span>
  );
}
