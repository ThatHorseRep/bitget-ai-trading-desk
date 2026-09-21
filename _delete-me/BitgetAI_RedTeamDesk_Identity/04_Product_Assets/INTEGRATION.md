# Integration — dropping the identity into the repo

Written against the actual tree of `ThatHorseRep/bitget-ai-trading-desk` as of this
build. Every path below already exists unless marked **new**.

Estimated time: about 20 minutes, no new dependencies.

---

## 1. Static assets

Copy the whole of `04_Product_Assets/public/` into the repo's `public/` directory.
Next.js 16 serves these from the root.

```
public/favicon.ico              multi-size, 16 → 256
public/favicon.svg              optical cut, heavier seam
public/icon.svg                 full-size vector
public/apple-touch-icon.png     180×180
public/icon-192.png
public/icon-512.png
public/maskable-icon-512.png    safe-area padded for Android
public/og-image.png             1200×630, X and OpenGraph
public/readme-banner.png        1280×300
public/manifest.webmanifest
```

> The repo has no `public/` directory yet — create it. Next.js picks it up with no
> config change.

---

## 2. Brand tokens

**Replace** `src/config/branding.ts`.

The current file is a single line:

```ts
export const BRANDING = { PRODUCT_NAME: "Bitget AI RedTeam Desk", SHORT_NAME: "RedTeam Desk" };
```

The replacement keeps both keys with identical values, so **nothing that imports
`BRANDING` breaks**. It adds `COLOR`, `VERDICT_COLOR`, `VERDICT_OFFSET`, `REF_OFFSET`
and a `Verdict` type.

`Verdict` is deliberately spelled to match the four strings already produced by
`evaluateDecision()` in `src/core/decision/policy.ts`. If you later add a fifth verdict,
add it in both places and give it a displacement.

---

## 3. Design tokens in CSS

`src/app/globals.css` currently holds the Tailwind import, `color-scheme`, a body rule
and a mono rule. The supplied file is a superset — it keeps all four and adds the
custom properties, `.rtd-figure`, `.rtd-fault`, and a reduced-motion guard.

Safe to overwrite. The one behavioural change: `body` now sets
`background: var(--rtd-proof)` and `color: var(--rtd-ink)`, so you can drop
`className="bg-zinc-100/50 text-zinc-900"` from the `<body>` tag in `layout.tsx`
(the supplied `layout.tsx` already has).

---

## 4. Metadata

**Replace** `src/app/layout.tsx`. Diff against the current file:

- keeps both `localFont` declarations and the `geistSans` / `geistMono` variables
  exactly as they are
- adds `metadataBase`, a title template, icons, OpenGraph and Twitter card
- adds `export const viewport = { themeColor: COLOR.ink }`
- drops the hard-coded body classes in favour of the CSS tokens

Set `BRANDING.URL` in `branding.ts` to your real deployment before shipping —
`metadataBase` uses it to resolve `/og-image.png` to an absolute URL, and X will not
render the card from a relative path.

---

## 5. Brand components **(new)**

Create `src/components/brand/` and add three files:

| File | What it is |
|---|---|
| `mark.ts` | The geometry engine. Computes the mark at any displacement. No JSX. |
| `Logo.tsx` | `<Mark>` and `<Lockup>`. |
| `VerdictGlyph.tsx` | `<VerdictGlyph>` and `<VerdictBadge>`. |

`mark.ts` is a verified port of the reference engine used to cut the artwork — the
output paths are byte-identical for the primary, small, `PROCEED` and `REJECT` cuts.
Nothing is a traced path, so the mark is never off-spec.

`<Mark>` switches to the optical small cut automatically at ≤32px. Do not defeat this;
the seam closes on the pixel grid otherwise.

### Where to wire it in

- **`src/components/workspace/WorkspaceHeader.tsx`** — replace the current title
  treatment with `<Lockup height={32} />`.
- **`src/components/workspace/DecisionArtifactView.tsx`** — this renders
  `decision.verdict`. Put `<VerdictBadge verdict={decision.verdict} />` where the
  verdict string is currently printed. This is the highest-value single change in the
  whole integration: it is the moment the logo starts carrying the reading.
- **`src/components/workspace/AnalysisProgressView.tsx`** — an optional but strong
  moment. Animate `offset` from `0` to `REF_OFFSET` while the stress test runs, then
  settle on the returned verdict's offset. The mark literally shears as the desk finds
  the risk. Gate it behind `prefers-reduced-motion`.
- **Any element holding a figure from the deterministic engine** — add
  `className="rtd-figure"`. Expected shortfall, VaR, basis spread, depth, beta.

---

## 6. README

Add the banner at the top of `README.md`, above the existing `# Bitget AI RedTeam Desk`
heading (or replacing it — the banner already contains the wordmark):

```md
![Bitget AI RedTeam Desk](./public/readme-banner.png)
```

Then set the repo's social preview: **Settings → General → Social preview → Upload** and
use `public/og-image.png`. GitHub will then render the card when the repo link is pasted
into the submission form, Telegram, or X.

---

## 7. Submission and campaign surfaces

Not code, but they are what the hackathon actually scores.

- **X promotional post** (required; a missing or non-compliant post invalidates the
  entry). Use `05_Campaign/png/x-01-launch.png`. It already carries `#BitgetHackathon`
  and `@Bitget_AI`.
- **Build-in-public posts** feed the Best Spread Award, which is judged on your own
  reach data. `x-02-devlog` and `x-03-verdicts` are built as a series so a thread reads
  as one campaign.
- **Screen recording** — `video-01-title-card` and `video-02-end-card` at 1920×1080 top
  and tail the demo. The Track 3 brief asks for one complete research task from question
  to actionable insight; the title card sets that expectation in the first second.
- **Deck** — `deck-01-cover` for any Demo Day or Spotlight follow-up.

---

## 8. Verification

```bash
npm run typecheck   # branding.ts, mark.ts, Logo.tsx, VerdictGlyph.tsx
npm run lint
npm run build
```

`mark.ts` is dependency-free and strict-mode clean. The components use inline styles
rather than Tailwind classes so they cannot be broken by a future Tailwind config
change.
