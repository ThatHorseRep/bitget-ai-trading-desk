# Bitget AI RedTeam Desk — Brand Identity

Complete visual identity, application mockups, and production-ready product assets.

---

## Open these first

| | |
|---|---|
| **`01_Brand_Guidelines/brand-guidelines.html`** | The standards document. Open in a browser. |
| **`01_Brand_Guidelines/Design_Rationale.md`** | Why every decision was made, and what was rejected. |
| **`04_Product_Assets/INTEGRATION.md`** | Step-by-step wiring into the existing repo. |

---

## The idea in one paragraph

An octagonal token, cut by a fault plane at −12°, with the two halves displaced along
it. The gap is the basis gap — the drift that opens across the 65.5 hours a week that
tokenized equities trade with no reference market open. Displacement is a parameter, not
a drawing, so the same construction generates the whole verdict set: `PROCEED` at 0u,
`REDUCE` at 4.5u, `WAIT` at 9u, `REJECT` at 15u. The logo sits at the 9u reference cut.
A user who learns the scale inside the product reads the logo differently outside it.

Red appears in exactly two places: the fault, and `REJECT`. Nowhere else.

---

## Contents

```
01_Brand_Guidelines/    standards document + rationale
02_Logo/
  primary/              8 masters — colour, reversed, mono, knockout, optical cut
  lockups/              12 — horizontal, stacked, endorsed, wordmark
  icons/                app icons, favicon, maskable
  verdict-system/       8 glyphs + the scale drawing
  construction/         grid, clearspace, size ladder, misuse
  png/                  campaign-resolution exports
03_Mockups/             business cards, billboard, storefront, packaging,
                        website, product, social — SVG + PNG
04_Product_Assets/      drop-in for the repo
  public/               favicons, OG image, banner, manifest
  src/                  branding.ts, globals.css, layout.tsx, brand components
  INTEGRATION.md
05_Campaign/            X cards, video title/end cards, deck cover, overhang rule
_fonts/                 Geist Sans + Mono (used by the guidelines document)
```

---

## Notes on the artwork

Every mark in this package is **computed, not traced**. The geometry is produced by
Sutherland–Hodgman clipping against the fault plane, and the seam is the exact
intersection of the fault band with the hull of the displaced halves — so the red is the
fault plane itself, never a line drawn on top.

All type in the SVG files is **outlined from the font binaries**. Nothing depends on a
font being installed on the viewing machine.

`04_Product_Assets/src/components/brand/mark.ts` is a TypeScript port of the same
engine, verified byte-identical against the reference for the primary, small, `PROCEED`
and `REJECT` cuts. The product can therefore render the mark at any displacement —
including animating it as a stress test runs.

---

## Two standing rules

1. **Red is a verdict, not a decoration.** Not links, not hovers, not focus, not
   emphasis. If red is on screen, something failed.
2. **The fault device never crosses type.** It is a measured rule that closes a text
   block. A red line through a headline reads as a strike-through.

---

*Identity v1.0 · Bitget AI Base Camp Hackathon S2 · Track 3, Decision Stress Testing*
