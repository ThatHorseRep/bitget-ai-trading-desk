"use client";

import { markGeometry, SPEC, SPEC_SMALL, type MarkSpec } from "./mark";
import { BRANDING, COLOR } from "@/config/branding";

interface MarkProps {
  size?: number;
  body?: string;
  fault?: string;
  offset?: number;
  title?: string;
  className?: string;
}

/**
 * The mark. Below 32px it switches to the optical cut automatically so the
 * seam survives the pixel grid — this is not a style choice, the hairline
 * disappears otherwise.
 */
export function Mark({
  size = 32,
  body = "var(--rtd-ink)",
  fault = "var(--rtd-stamp)",
  offset,
  title = BRANDING.SHORT_NAME,
  className,
}: MarkProps) {
  const base: MarkSpec = size <= 32 ? SPEC_SMALL : SPEC;
  const { blocks, seam } = markGeometry(
    offset === undefined ? base : { ...base, offset }
  );
  // Displaced marks (e.g. REJECT with offset 15u) shift along the -12 deg fault line,
  // extending outer coordinates from -8.7 to +108.7. A balanced 1:1 viewBox (-12 -12 124 124)
  // ensures all 4 verdict states render with identical base scale and zero edge clipping.
  const viewBox = offset !== undefined ? "-12 -12 124 124" : "0 0 100 100";
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      {blocks.map((b, i) => (
        <path key={i} d={`${b.outer} ${b.inner}`} fill={body} fillRule="evenodd" />
      ))}
      <path d={seam} fill={fault} />
    </svg>
  );
}

interface LockupProps {
  height?: number;
  reversed?: boolean;
  endorsed?: boolean;
  className?: string;
}

/**
 * Horizontal lockup. The endorser is set in the sans face and the product in
 * the mono face — the platform speaks, the desk computes.
 */
export function Lockup({
  height = 32,
  reversed = false,
  endorsed = true,
  className,
}: LockupProps) {
  const ink = reversed ? "#FFFFFF" : "var(--rtd-ink)";
  const sub = reversed ? "rgba(240, 244, 248, 0.7)" : "var(--rtd-steel)";
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: height * 0.34 }}
    >
      <Mark size={height} body={ink} fault="var(--rtd-stamp)" />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {endorsed && (
          <span
            style={{
              fontSize: height * 0.23,
              letterSpacing: height * 0.075,
              color: sub,
              fontWeight: 560,
              marginBottom: height * 0.12,
            }}
          >
            {BRANDING.ENDORSER.toUpperCase()}
          </span>
        )}
        <span
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: height * 0.42,
            letterSpacing: height * 0.035,
            fontWeight: 620,
            color: ink,
          }}
        >
          {BRANDING.SHORT_NAME.toUpperCase()}
        </span>
      </span>
    </span>
  );
}
