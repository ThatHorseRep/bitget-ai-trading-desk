# Bitget AI RedTeam Desk — Identity Implementation Plan (Revised)

## Executive Summary

This plan implements the visual identity system **adaptively**, respecting existing conventions and minimizing risk. We start with **Token Foundation → CSS Integration → Component Refinement**, deferring PWA infrastructure until the visual system is stable.

---

## 📊 Codebase Audit Results

| Aspect | Finding | Implication |
|--------|---------|-------------|
| **State Management** | No Zustand/Jotai/Redux detected | Use React Context or props; avoid new dependencies |
| **CSS Architecture** | Minimal `globals.css` (22 lines) | Safe to inject variables into existing `:root` |
| **Verdict Rendering** | Hardcoded in `DecisionArtifactView.tsx` | Extract to theme tokens; add snapshot tests |
| **Testing** | Playwright E2E + Node.js core tests | Add Vitest for component unit tests |
| **Build System** | Next 16 + Tailwind 4 | Use CSS variables + Tailwind `@theme` |

---

## 🗺️ Revised Phase Flow (Graphical)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 0: DISCOVERY & PLANNING                      │
│  [✓] Audit state libs  →  [✓] Locate verdict sites  →  [✓] Map CSS globals  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: TOKEN FOUNDATION (Core)                      │
│   Define semantic color palettes → Typography scale → Spacing/elevation     │
│                          Output: src/tokens/identity.ts                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: CSS VARIABLE INJECTION (Safe)                    │
│   Inject :root variables via str_replace → Wire to Tailwind @theme layer    │
│                 Risk mitigation: Preserve existing CSS rules                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: COMPONENT REFACTOR (Iterative)                    │
│   DecisionArtifactView → WorkspaceHeader → VerdictBadge (extracted)         │
│            Replace hardcoded colors with CSS var() references               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              PHASE 4: ANIMATION & MICRO-INTERACTIONS (CSS-first)             │
│   Transforms only (no layout thrash) → requestAnimationFrame for SVG marks  │
│                    Framer Motion ONLY if already present                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 5: AUTOMATED TESTING (Parallel)                    │
│   Vitest unit tests for markGeometry() → RTL snapshots for VerdictBadge     │
│                    Playwright visual regression for key views               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PHASE 6: METADATA & SEO (Semantic Checks)                   │
│   Verify viewport-fit=cover → Check meta tag completeness (no rigid counts) │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              PHASE 7: MANUAL SMOKE TESTS + LIGHTHOUSE (Validation)           │
│   Cross-browser checks → Performance profiling → Accessibility audit        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 8: PWA INFRASTRUCTURE (Deferred)                   │
│   manifest.json → Service worker → Offline fallback (now meaningful)        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 9: ROLLBACK STRATEGY (Safety)                   │
│   Git branch per phase → Feature flags for visual changes → Quick revert    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Detailed Phase Breakdown

### Phase 0: Discovery & Planning ✅ (Completed)
**Objective:** Understand existing architecture before making changes.

**Actions Taken:**
- ✅ Searched for state libraries: **None found** (React-only)
- ✅ Located verdict rendering: `DecisionArtifactView.tsx` (681 lines)
- ✅ Audited `globals.css`: 22 lines, single `:root` block
- ✅ Confirmed build stack: Next 16 + Tailwind 4 + Playwright

**Key Insight:** No need for Zustand/Context over-engineering. Props drilling suffices for current complexity.

---

### Phase 1: Token Foundation
**Goal:** Create single source of truth for identity tokens.

**File:** `src/tokens/identity.ts`

```typescript
export const IDENTITY = {
  colors: {
    // Semantic palette (not raw HSL)
    verdict: {
      proceed: { bg: 'hsl(150 100% 96%)', text: 'hsl(150 100% 20%)', border: 'hsl(150 50% 70%)' },
      wait:    { bg: 'hsl(45 100% 96%)',  text: 'hsl(45 100% 25%)',  border: 'hsl(45 50% 70%)' },
      reduce:  { bg: 'hsl(25 100% 96%)',  text: 'hsl(25 100% 25%)',  border: 'hsl(25 50% 70%)' },
      reject:  { bg: 'hsl(350 100% 96%)', text: 'hsl(350 100% 20%)', border: 'hsl(350 50% 70%)' }
    },
    brand: {
      primary: 'hsl(0 0% 9%)',    // zinc-900
      accent:  'hsl(220 90% 50%)' // royal blue for interactive
    }
  },
  typography: {
    heading: { family: 'var(--font-geist-sans)', weight: '700' },
    body:    { family: 'var(--font-geist-sans)', weight: '400' },
    mono:    { family: 'var(--font-geist-mono)', weight: '400' }
  },
  spacing: { /* 4px grid scale */ },
  elevation: { /* shadow tokens */ }
};
```

**Validation:** TypeScript compile + manual inspection.

---

### Phase 2: CSS Variable Injection (Safe)
**Goal:** Wire tokens to CSS without overwriting existing styles.

**Approach:** Use `str_replace` to **append** to existing `:root` block.

**Before:**
```css
:root {
  color-scheme: light;
}
```

**After:**
```css
:root {
  color-scheme: light;
  
  /* Identity tokens — auto-generated from src/tokens/identity.ts */
  --verdict-proceed-bg: hsl(150 100% 96%);
  --verdict-proceed-text: hsl(150 100% 20%);
  --verdict-proceed-border: hsl(150 50% 70%);
  /* ... etc */
}
```

**Rollback Safety:** Single atomic edit; git diff shows exact changes.

---

### Phase 3: Component Refactor
**Goal:** Replace hardcoded Tailwind classes with CSS variable references.

**Target Files:**
1. `src/components/workspace/DecisionArtifactView.tsx`
2. `src/components/workspace/WorkspaceHeader.tsx`

**Strategy:**
- Extract `VERDICT_CONFIG` to use `var(--verdict-*-*)` values
- Create reusable `<VerdictBadge>` component (DRY)
- Preserve existing functionality (copy JSON, provenance modal)

**Example Change:**
```tsx
// Before
bg: "bg-emerald-50"

// After
bg: "bg-[var(--verdict-proceed-bg)]"
```

**Testing:** Visual regression screenshots via Playwright.

---

### Phase 4: Animation & Micro-interactions
**Goal:** Add polish without performance regressions.

**Rules:**
- ✅ Animate `transform` and `opacity` only (GPU-accelerated)
- ✅ Use CSS transitions for hover/focus states
- ❌ Avoid animating layout properties (width, height, margin)
- ❌ No `requestAnimationFrame` in React render loop unless memoized

**Implementation:**
```css
.verdict-badge {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.verdict-badge:hover {
  transform: scale(1.05);
}
```

**SVG Mark Animation:** Use CSS `stroke-dashoffset` transitions, not JS state.

---

### Phase 5: Automated Testing (Parallel Track)
**Goal:** Prevent regressions with automated checks.

**Test Pyramid:**
```
        ┌───────────────┐
        │  E2E (Playwright)  │  ← Visual regression for DecisionArtifactView
        └───────────────┘
              ↓
    ┌───────────────────┐
    │ Component (RTL Snapshots) │ ← VerdictBadge, WorkspaceHeader
    └───────────────────┘
              ↓
      ┌───────────────┐
      │ Unit (Vitest) │ ← markGeometry(), token utilities
      └───────────────┘
```

**New Files:**
- `src/components/workspace/__tests__/VerdictBadge.test.tsx`
- `src/domain/geometry/__tests__/mark.test.ts`

**CI Integration:** Run on every PR; block merge if snapshots mismatch.

---

### Phase 6: Metadata & SEO (Semantic Checks)
**Goal:** Ensure proper metadata without brittle counts.

**Checks:**
- ✅ `viewport` includes `viewport-fit=cover` (for mobile notch safety)
- ✅ `description` meta tag exists and is < 160 chars
- ✅ `og:title` and `og:description` match branding
- ✅ `theme-color` matches brand primary

**Avoid:** "Must have exactly 8 meta tags" — instead verify **presence** of critical tags.

---

### Phase 7: Manual Smoke Tests + Lighthouse
**Goal:** Human validation + performance benchmarking.

**Checklist:**
- [ ] Chrome/Firefox/Safari visual parity
- [ ] Mobile responsive (320px → 1920px)
- [ ] Dark mode readiness (future-proof)
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] No console errors/warnings

---

### Phase 8: PWA Infrastructure (Deferred)
**Goal:** Enable installability + offline support **after** visual stability.

**Why Deferred:** Cannot test service worker caching meaningfully when UI is in flux.

**Steps:**
1. Generate `manifest.json` with brand colors/icons
2. Register service worker in `layout.tsx`
3. Cache shell + static assets
4. Test offline mode with Playwright network throttling

---

### Phase 9: Rollback Strategy
**Goal:** Minimize risk with safe deployment practices.

**Tactics:**
- **Feature Branch Per Phase:** `feature/identity-phase-1`, etc.
- **Git Tags:** `identity-phase-1-complete`
- **Quick Revert Script:** `git revert HEAD~N --no-edit`
- **Feature Flags:** Wrap visual changes in `process.env.NEXT_PUBLIC_IDENTITY_V2`

---

## 🚦 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Visual Consistency** | 100% token usage | Grep for `hsl(` in components (should be 0) |
| **Performance** | Lighthouse ≥ 90 | `npm run lighthouse` |
| **Test Coverage** | ≥ 80% for tokens + components | Vitest coverage report |
| **Rollback Time** | < 5 minutes | Git revert + deploy |
| **Accessibility** | WCAG 2.1 AA | axe-core scan |

---

## 📅 Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 (Tokens) | 2 hours | None |
| Phase 2 (CSS) | 1 hour | Phase 1 |
| Phase 3 (Components) | 4 hours | Phase 2 |
| Phase 4 (Animation) | 2 hours | Phase 3 |
| Phase 5 (Testing) | 3 hours | Parallel |
| Phase 6 (Metadata) | 1 hour | None |
| Phase 7 (Smoke) | 2 hours | All above |
| Phase 8 (PWA) | 3 hours | Phase 7 |

**Total:** ~18 hours (can be parallelized to ~12 hours wall-clock)

---

## ⚠️ Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS variable drift | Low | Medium | Automated token sync script |
| Component regression | Medium | High | Snapshot tests + visual regression |
| Performance degradation | Low | High | Lighthouse CI gating |
| PWA cache staleness | Medium | Medium | Versioned cache names + skipUntilPhase8 |

---

## 🎯 Next Immediate Actions

1. **Create `src/tokens/identity.ts`** with full token definitions
2. **Inject CSS variables** into `globals.css` via `str_replace`
3. **Refactor `DecisionArtifactView.tsx`** to use tokens
4. **Write first Vitest test** for token utilities
5. **Run typecheck + lint** to validate changes
