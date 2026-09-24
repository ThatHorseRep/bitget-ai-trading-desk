/**
 * Bitget AI RedTeam Desk — brand tokens.
 *
 * Replaces the previous one-line PRODUCT_NAME stub. Everything the UI needs to
 * stay on-brand lives here so no component hard-codes a hex value.
 *
 * Colour discipline: Stamp Red is reserved. It marks the fault in the logo and
 * the REJECT verdict. It is never used for decoration, hover states, links, or
 * emphasis. If red appears on screen, something failed.
 */

export const BRANDING = {
  PRODUCT_NAME: "Bitget AI RedTeam Desk",
  SHORT_NAME: "RedTeam Desk",
  ENDORSER: "Bitget AI",
  WORDMARK: "REDTEAM DESK",
  TAGLINE: "Thesis \u2260 Position.",
  DESCRIPTION:
    "Adversarial pre-trade risk workbench for tokenized US equities. " +
    "Deterministic stress testing, basis decoupling analysis, and thesis " +
    "versus position deconstruction.",
  URL: "https://www.redteamdesk.name.ng",
  LOGOS: {
    MARK: "/icon.svg",
    FAVICON: "/favicon.svg",
    OG_IMAGE: "/og-image.png",
    VERDICT_STATE_1: "/state-1.svg",
    VERDICT_STATE_2: "/state-2.svg",
    VERDICT_STATE_3: "/state-3.svg",
    VERDICT_STATE_4: "/state-4.svg",
    VERDICT_REJECT: "/verdict-reject.svg",
    VERDICT_WAIT: "/verdict-wait.svg",
    VERDICT_REDUCE: "/verdict-reduce.svg",
    VERDICT_PROCEED: "/verdict-proceed.svg",
  }
} as const;

export const COLOR = {
  ink: "#0E2436",        // Blueprint Navy — primary structure, body of the mark
  void: "#06121C",       // Deep Field — dark surfaces, app chrome
  stamp: "#C8102E",      // Stamp Red — the fault, and REJECT. Nothing else.
  proof: "#E7E9E6",      // Proof Gray — the report ground
  paper: "#F7F8F6",      // Bright Proof — high-key ground
  steel: "#54697E",      // Steel — rules, axes, secondary type
} as const;

export const VERDICT_COLOR = {
  PROCEED: "#0E9F8B",
  REDUCE: "#C98A14",
  WAIT: "#54697E",
  REJECT: "#C8102E",
} as const;

/**
 * Displacement, in mark units, for each verdict. This is the identity's core
 * idea: the logo is a token displaced along a fault, and how far it moves is
 * how much risk the desk found. The brand mark sits at REF_OFFSET.
 */
export const VERDICT_OFFSET = {
  PROCEED: 0,
  REDUCE: 4.5,
  WAIT: 9,
  REJECT: 15,
} as const;

export const REF_OFFSET = 9;

export type Verdict = keyof typeof VERDICT_COLOR;
