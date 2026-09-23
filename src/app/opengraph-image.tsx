import { ImageResponse } from "next/og";
import { BRANDING, COLOR } from "@/config/branding";
import { markGeometry, SPEC } from "@/components/brand/mark";

export const runtime = "nodejs";

export const alt = `${BRANDING.PRODUCT_NAME} • ${BRANDING.TAGLINE}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const { blocks, seam } = markGeometry({ ...SPEC, offset: 9 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: COLOR.void, // Deep Field #06121C - matching website hero
          color: COLOR.paper,
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Top Header: Brand Lockup & Endorser */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Logo mark + Brand wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <svg
              viewBox="0 0 100 100"
              width="64"
              height="64"
              style={{ display: "block" }}
            >
              {blocks.map((b, i) => (
                <path
                  key={i}
                  d={`${b.outer} ${b.inner}`}
                  fill="#FFFFFF"
                  fillRule="evenodd"
                />
              ))}
              <path d={seam} fill={COLOR.stamp} />
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.2em",
                  color: COLOR.steel,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {BRANDING.ENDORSER}
              </span>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#FFFFFF",
                }}
              >
                {BRANDING.WORDMARK}
              </span>
            </div>
          </div>

          {/* Operational Window Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${COLOR.steel}`,
              padding: "8px 16px",
              fontSize: 13,
              letterSpacing: "0.1em",
              color: COLOR.steel,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            65.5h Off-Hours Window
          </div>
        </div>

        {/* Center: Hero Thesis Headline matching website */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span>Thesis</span>
            <span style={{ color: COLOR.stamp, fontWeight: 900 }}>≠</span>
            <span>Position.</span>
          </div>

          <div
            style={{
              fontSize: 22,
              lineHeight: 1.45,
              color: COLOR.steel,
              maxWidth: 880,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Pre-trade adversarial risk firewall for tokenized US equities.
            Stress test basis decoupling, liquidity collapse, and contagion
            during the weekend gap.
          </div>
        </div>

        {/* Bottom Bar: Deterministic Outcomes & Fault Line Rule */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Fault line separator */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "2px",
              backgroundColor: COLOR.steel,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 120,
                width: 60,
                height: 2,
                backgroundColor: COLOR.stamp,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
              letterSpacing: "0.12em",
              color: COLOR.steel,
              textTransform: "uppercase",
            }}
          >
            <span>DETERMINISTIC VERDICTS: PROCEED • REDUCE • WAIT • REJECT</span>
            <span style={{ color: "#FFFFFF", fontWeight: 700 }}>
              BITGET AI REDTEAM DESK
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
