import { ImageResponse } from "next/og";
import { BRANDING } from "@/config/branding";

export const runtime = "edge";
export const alt = `${BRANDING.PRODUCT_NAME} — ${BRANDING.TAGLINE}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#06121C",
          color: "#F7F8F6",
          fontFamily: "sans-serif",
          border: "8px solid #0E2436",
        }}
      >
        {/* Top Bar / Endorser */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #1E384D",
            paddingBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#0E2436",
                border: "1px solid #54697E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0E9F8B",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              ⯛
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "14px",
                  letterSpacing: "0.2em",
                  color: "#54697E",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                }}
              >
                {BRANDING.ENDORSER}
              </span>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  letterSpacing: "0.05em",
                  color: "#F7F8F6",
                }}
              >
                {BRANDING.WORDMARK}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "6px 16px",
              backgroundColor: "#0E2436",
              border: "1px solid #54697E",
              color: "#0E9F8B",
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Deterministic Risk Engine S05
          </div>
        </div>

        {/* Center Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "900",
              lineHeight: 1.15,
              color: "#F7F8F6",
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            Adversarial Pre-Trade Risk Workbench
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "#8B9EB0",
              lineHeight: 1.4,
              maxWidth: "920px",
            }}
          >
            Stress-test off-hours basis decoupling, crypto liquidity contagion, and thesis invalidation on 24/7 tokenized equities.
          </p>
        </div>

        {/* Bottom Bar: Deterministic Gating Verdict Bands */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1E384D",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#0E2436",
                border: "1px solid #C8102E",
                color: "#C8102E",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              STATE 1 • REJECT
            </div>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#0E2436",
                border: "1px solid #54697E",
                color: "#8B9EB0",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              STATE 2 • WAIT
            </div>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#0E2436",
                border: "1px solid #C98A14",
                color: "#C98A14",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              STATE 3 • REDUCE
            </div>
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#0E2436",
                border: "1px solid #0E9F8B",
                color: "#0E9F8B",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              STATE 4 • PROCEED
            </div>
          </div>

          <span
            style={{
              fontSize: "14px",
              color: "#54697E",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            PURE MATH GATING • PROVENANCE TRACEABLE
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
