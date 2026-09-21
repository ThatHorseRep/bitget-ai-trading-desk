# Bitget AI RedTeam Desk — Identity Token Manifest

> Single source of truth for all brand and design tokens extracted directly from `BitgetAI_RedTeamDesk_Identity`.
> All values are exact, literal extractions from the identity specification documents (`00_START_HERE.md`, `Design_Rationale.md`, `brand-guidelines.html`, and `04_Product_Assets`).

---

## TABLE 1 - COLOR

| TOKEN_NAME | LITERAL_VALUE | SOURCE_FILE:LINE | PURPOSE |
|---|---|---|---|
| `--rt-surface-base` | `#E7E9E6` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:89` | The ground / page background (Proof Gray). Cool report proof stock. |
| `--rt-surface-raised` | `#F7F8F6` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:214` | Card surfaces, inputs, bright proof cards (Paper). Elevated clarity surface. |
| `--rt-surface-void` | `#06121C` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:90` | App chrome, night applications, dark mode panels (Deep Field). |
| `--rt-text-primary` | `#0E2436` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:87` | Primary structure, body of the mark, headings (Blueprint Navy). Main contrast. |
| `--rt-text-muted` | `#54697E` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:91` | Rules, axes, secondary type, table metadata (Steel). Neutral boundary. |
| `--rt-border-subtle` | `#CFD4CF` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:215` | Subtle grid lines, container boundaries (Border Gray). Structural 1px division. |
| `--rt-accent` | `#0E2436` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:87` | Primary brand accent and ink structure. |
| `--rt-verdict-critical` | `#C8102E` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:88` | REJECT verdict and mark fault seam (Stamp Red). Strictly reserved. |
| `--rt-verdict-elevated` | `#54697E` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:91` | WAIT verdict mark dashed seam (Steel). Input degraded/uncertain. |
| `--rt-verdict-moderate` | `#C98A14` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:242` | REDUCE verdict mark solid seam (Amber). Position sizing reduction required. |
| `--rt-verdict-clear` | `#0E9F8B` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:98` | PROCEED verdict mark solid seam (Teal). Whole token survives stress test. |

---

## TABLE 2 - TYPOGRAPHY

| TOKEN_NAME | FAMILY | WEIGHT | SIZE | LINE_HEIGHT | LETTER_SPACING | SOURCE_FILE:LINE | USED_FOR |
|---|---|---|---|---|---|---|---|
| `--rt-type-body` | `GeistLocal, sans-serif` | `400` | `16px` | `1.55` | `normal` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:26` | Body copy, explanations, narrative prose |
| `--rt-type-h1` | `GeistMonoLocal, monospace` | `620` | `clamp(32px, 6vw, 62px)` | `1.15` | `0.01em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:37` | Primary screen title / display headings |
| `--rt-type-h2` | `GeistMonoLocal, monospace` | `620` | `clamp(22px, 3vw, 32px)` | `1.2` | `0.01em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:47` | Section headings, panel titles |
| `--rt-type-lede` | `GeistLocal, sans-serif` | `400` | `clamp(16px, 2vw, 21px)` | `1.4` | `normal` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:39` | Lead paragraphs, introduction summary |
| `--rt-type-kicker` | `GeistMonoLocal, monospace` | `620` | `12px` | `1.2` | `0.34em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:46` | Overline category tags, section kickers |
| `--rt-type-endorser` | `GeistLocal, sans-serif` | `560` | `12px` | `1.2` | `0.42em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:34` | Brand endorsement lockup (`BITGET AI`) |
| `--rt-type-wordmark` | `GeistMonoLocal, monospace` | `620` | `22px` | `1.2` | `0.14em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:35` | Product brand mark text (`REDTEAM DESK`) |
| `--rt-type-figure` | `GeistMonoLocal, monospace` | `620` | `16px` | `1.2` | `0.08em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:120` | Quantitative risk metrics (tabular-nums) |
| `--rt-type-verdict-title` | `GeistMonoLocal, monospace` | `620` | `15px` | `1.2` | `0.18em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:81` | Verdict state banner name (`REJECT`, `WAIT`, `REDUCE`, `PROCEED`) |
| `--rt-type-caption` | `GeistMonoLocal, monospace` | `400` | `11px` | `1.3` | `0.14em` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:56` | Table footnotes, axis labels, captions |

---

## TABLE 3 - SPACING / RADIUS / ELEVATION

| TOKEN_NAME | VALUE | SOURCE_FILE:LINE |
|---|---|---|
| `--rt-space-gutter` | `clamp(24px, 5vw, 88px)` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:21` |
| `--rt-space-section-y` | `clamp(48px, 7vw, 104px)` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:44` |
| `--rt-space-mast-gap` | `22px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:33` |
| `--rt-space-card-padding` | `30px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:80` |
| `--rt-radius-sharp` | `2px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:67` |
| `--rt-radius-card` | `0px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:144` |
| `--rt-border-width-hairline` | `1px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:44` |
| `--rt-border-width-verdict` | `3px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:80` |
| `--rt-fault-width` | `240px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:40` |
| `--rt-fault-height` | `6px` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:40` |
| `--rt-fault-angle` | `-12deg` | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:41` |

---

## TABLE 4 - LOGO RULES

| RULE | VALUE | SOURCE_FILE:LINE |
|---|---|---|
| **Minimum Size** | `18px` height (display cut); `≤32px` switches to optical small cut (`mark-optical-small.svg`) | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:191` |
| **Clear Space** | `18u` on all 4 boundaries (equal to corner chamfer dimension). No typography or external graphics inside clear space. | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:298` |
| **Permitted Backgrounds** | `Proof Gray` (`#E7E9E6`), `Deep Field` (`#06121C`), `Paper` (`#F7F8F6`), or `White` (`#FFFFFF`). Strictly no warm cream or decorative colored backgrounds. | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md:95` |
| **Permitted Lockups** | Horizontal Endorsed (`lockup-horizontal-endorsed.svg`), Horizontal Plain (`lockup-horizontal.svg`), Stacked Endorsed (`lockup-stacked-endorsed.svg`), Stacked Plain (`lockup-stacked.svg`). | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:185` |
| **Verdict Scale State 1 (Critical)** | `state-1.svg` (`verdict-reject.svg`): `15u` displacement, `#C8102E` solid Stamp Red seam. Semantic: `REJECT` — counter-thesis holds, thesis invalidated. | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:242` |
| **Verdict Scale State 2 (Elevated)** | `state-2.svg` (`verdict-wait.svg`): `9u` displacement, `#54697E` dashed Steel seam (`stroke-dasharray="7 5"`). Semantic: `WAIT` — degraded/stale data or pending risk. | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:242` |
| **Verdict Scale State 3 (Moderate)** | `state-3.svg` (`verdict-reduce.svg`): `4.5u` displacement, `#C98A14` solid Amber seam. Semantic: `REDUCE` — visible slip, reduce position size. | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:242` |
| **Verdict Scale State 4 (Clear)** | `state-4.svg` (`verdict-proceed.svg`): `0u` displacement, `#0E9F8B` solid Teal seam. Semantic: `PROCEED` — whole token intact, passes all adversarial stress scenarios. | `BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html:242` |

---

## GAPS

The identity documentation specifies the core brand, typography, and verdict scale, but does not explicitly declare every operational UI state. Below are the extrapolation rules for each required UI gap:

1. **Focus Ring Color**:
   - *Extrapolation Rule*: Derive from `--rt-text-muted` (`#54697E` Steel) with 2px offset on light surfaces, or `--rt-border-subtle` (`#CFD4CF`). Never use `--rt-verdict-critical` (`#C8102E` Stamp Red) for focus rings.
2. **Disabled State**:
   - *Extrapolation Rule*: Set surface to `--rt-surface-base` (`#E7E9E6`) with text color `--rt-text-muted` at 40% opacity (`#54697E66`), border at 1px solid `--rt-border-subtle` (`#CFD4CF`).
3. **Error / Destructive Color (Non-Verdict)**:
   - *Extrapolation Rule*: Operational errors (form validation, network timeout) use `--rt-text-muted` with an alert icon, reserving `--rt-verdict-critical` (`#C8102E`) strictly for thesis/position risk invalidations. If destructive confirmation is required, use high-contrast `--rt-text-primary` (`#0E2436`) with explicit text warnings.
4. **Chart Series Colors (Beyond Verdict Scale)**:
   - *Extrapolation Rule*: Primary benchmark curve = `--rt-text-primary` (`#0E2436`), secondary comparison curve = `--rt-text-muted` (`#54697E`), stress baseline = `--rt-border-subtle` (`#CFD4CF`), overlaid risk breaches = `--rt-verdict-critical` (`#C8102E`).
5. **Skeleton Placeholder Color**:
   - *Extrapolation Rule*: Subtle pulse between `#E2E5E1` and `#ECEEEB` (interpolated between `--rt-surface-base` `#E7E9E6` and `--rt-surface-raised` `#F7F8F6`).
6. **Scrollbar Styling**:
   - *Extrapolation Rule*: Track set to `--rt-surface-base` (`#E7E9E6`), thumb set to `--rt-border-subtle` (`#CFD4CF`) hovering to `--rt-text-muted` (`#54697E`), width 6px, border-radius 2px.
