# Bitget AI RedTeam Desk — Complete Implementation Prompt Book

This document contains sequential prompts to implement the entire brand identity system into the `bitget-ai-trading-desk` repository. Each implementation phase is followed by an audit prompt to verify correctness before proceeding.

**Total estimated time:** 45–60 minutes  
**Prerequisites:** Node.js 20+, npm, git, existing Next.js 16 project

---

## Phase 0: Mobile-First PWA Foundation & Verdict UI Setup

### Prompt 0.1 — PWA Manifest & Service Worker Configuration
```
Implement the core PWA infrastructure for mobile-first deployment:
1. Create public/manifest.webmanifest with:
   - name: "Bitget AI RedTeam Desk"
   - short_name: "RedTeam Desk"
   - start_url: "/"
   - display: "standalone"
   - background_color: "#F5F5F0" (var(--rtd-proof))
   - theme_color: "#0E2436" (var(--rtd-ink))
   - icons array with all sizes (192x192, 512x512, maskable-512x512)
   - orientation: "portrait-primary" for mobile-first
2. Create src/app/sw.ts service worker with:
   - Cache-first strategy for static assets (icons, fonts, manifest)
   - Network-first strategy for API calls (/api/*)
   - Offline fallback page at /offline
   - Precache all brand assets from /public/
3. Register the service worker in src/app/layout.tsx or a dedicated provider
4. Add <meta name="theme-color"> tags to layout.tsx head

Ensure the manifest supports PWA installation on Android Chrome and iOS Safari (with apple-touch-icon configuration).
```

### Audit Prompt 0.1 — PWA Foundation Verification
```
Audit the PWA setup. Verify that:
1. manifest.webmanifest is valid JSON and accessible at /manifest.webmanifest
2. All icon references in manifest point to existing files in public/
3. Service worker registers successfully (check DevTools → Application → Service Workers)
4. Cache storage shows precached brand assets (at least 9 files)
5. Theme color meta tag is present in <head> with value #0E2436
6. Mobile viewport meta tag includes viewport-fit=cover for edge-to-edge displays
7. apple-touch-icon links are present with correct sizes (180x180 minimum)

Run: curl -s http://localhost:<port>/manifest.webmanifest | jq . and verify all required fields. Test PWA install prompt on Chrome mobile (or DevTools Device Mode). If any check fails, fix before proceeding.
```

### Prompt 0.2 — Mobile-First Viewport & Responsive Meta Tags
```
Update src/app/layout.tsx to add comprehensive mobile-first meta tags:
1. Add viewport meta with: width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5
2. Add apple-mobile-web-app-capable: yes for iOS fullscreen
3. Add apple-mobile-web-app-status-bar-style: black-translucent
4. Add mobile-web-app-capable: yes for Android
5. Add format-detection telephone=no to prevent auto-linking
6. Ensure <html> has lang="en" and dir="ltr"
7. Add <link rel="canonical"> pointing to BRANDING.URL

These tags ensure the app behaves like a native app when installed on mobile devices.
```

### Audit Prompt 0.2 — Mobile Meta Tags Verification
```
Audit src/app/layout.tsx head section. Verify that:
1. viewport meta includes all 5 parameters (width, initial-scale, viewport-fit, maximum-scale, user-scalable)
2. All apple-mobile-web-app-* tags are present
3. theme-color meta tag matches COLOR.ink (#0E2436)
4. canonical link uses BRANDING.URL (not hard-coded)
5. No conflicting viewport settings exist
6. iOS-specific tags use correct values (black-translucent, not default)

Run: npm run dev, then curl -s http://localhost:<port>/ | grep -i meta and count mobile-related tags. Expect at least 8 meta tags for mobile optimization. Test on actual iOS device to confirm fullscreen launch.
```

### Prompt 0.3 — Verdict UI State Management Setup
```
Create the verdict state management foundation:
1. Create src/core/verdictStore.ts with:
   - VerdictState interface (currentVerdict, confidence, timestamp, metadata)
   - createVerdictStore() function using Zustand or React Context
   - Actions: setVerdict(), clearVerdict(), getHistory()
   - Persistence layer using localStorage (key: 'rtd-verdict-history')
2. Create src/hooks/useVerdict.ts custom hook:
   - Wraps the store with React hooks
   - Provides computed properties (isDecisive, riskLevel)
   - Handles optimistic updates during analysis
3. Create src/types/verdict.ts with:
   - VerdictDecision type extending base Verdict
   - ConfidenceScore type (0-100 with validation)
   - VerdictMetadata interface (reasoning, factors, timestamps)

This sets up the reactive state system that powers the VerdictBadge animations and history tracking.
```

### Audit Prompt 0.3 — Verdict State Verification
```
Audit the verdict state management. Verify that:
1. verdictStore.ts exports createVerdictStore and all actions
2. useVerdict hook provides all required methods (setVerdict, clearVerdict, etc.)
3. localStorage persistence works (set a verdict, reload page, verify it persists)
4. VerdictDecision type includes all fields from branding.ts Verdict plus confidence
5. No circular dependencies between store, hooks, and types
6. TypeScript infers correct types throughout (no any)

Run: npx tsc --noEmit src/core/verdictStore.ts src/hooks/useVerdict.ts src/types/verdict.ts. Test in browser: open DevTools Console, execute window.debugVerdictStore = createVerdictStore(), then verify store methods work. Check localStorage for 'rtd-verdict-history' key after setting a verdict.
```

---

## Phase 1: Project Discovery & Context Gathering

### Prompt 1.1 — Repository Structure Analysis
```
Analyze the current repository structure of the bitget-ai-trading-desk project. List all directories under src/, identify existing component patterns, check for any existing branding or theme files, and map out where WorkspaceHeader.tsx and DecisionArtifactView.tsx are located. Report the exact file paths and their current imports.
```

### Audit Prompt 1.1 — Structure Verification
```
Audit the repository structure report. Verify that:
1. The src/ directory exists with app/, components/, config/, core/ subdirectories
2. No conflicting brand tokens exist in src/config/
3. WorkspaceHeader.tsx and DecisionArtifactView.tsx are found and readable
4. The public/ directory status is identified (exists or needs creation)
5. Tailwind CSS v4 is confirmed as the styling system

If any discrepancy is found, halt and report the exact conflict before proceeding.
```

---

## Phase 2: Static Assets Installation

### Prompt 2.1 — Copy Brand Assets to Public Directory
```
Copy all static assets from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/public/ to the project root's public/ directory. This includes:
- favicon.ico, favicon.svg, icon.svg
- apple-touch-icon.png, icon-192.png, icon-512.png, maskable-icon-512.png
- og-image.png, readme-banner.png
- manifest.webmanifest

Create the public/ directory if it doesn't exist. Preserve all file names exactly. After copying, list all files now in public/ to confirm successful transfer.
```

### Audit Prompt 2.1 — Asset Integrity Check
```
Audit the public/ directory contents. Verify that:
1. All 9 files from the identity package are present in public/
2. File sizes match the originals (no truncation during copy)
3. SVG files contain valid XML and reference the correct brand colors (#0E2436, #C8102E)
4. PNG files are non-zero size and valid image format
5. manifest.webmanifest contains valid JSON with name "Bitget AI RedTeam Desk"
6. No extra or unexpected files were added

Run: ls -la public/ and report any missing or corrupted files. If verification fails, re-copy the assets and report again.
```

---

## Phase 3: Brand Tokens Configuration

### Prompt 3.1 — Replace branding.ts
```
Replace the contents of src/config/branding.ts with the complete brand tokens file from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/config/branding.ts. The new file must include:
- BRANDING object with PRODUCT_NAME, SHORT_NAME, ENDORSER, TAGLINE, DESCRIPTION, URL
- COLOR object with ink, void, stamp, proof, paper, steel hex values
- VERDICT_COLOR mapping for PROCEED, REDUCE, WAIT, REJECT
- VERDICT_OFFSET mapping with displacements (0, 4.5, 9, 15)
- REF_OFFSET constant set to 9
- Verdict type derived from VERDICT_COLOR keys

Preserve the exact hex values and comments. Do not modify any other files yet.
```

### Audit Prompt 3.1 — Brand Tokens Validation
```
Audit src/config/branding.ts. Verify that:
1. All exports from the original identity file are present (BRANDING, COLOR, VERDICT_COLOR, VERDICT_OFFSET, REF_OFFSET, Verdict type)
2. Hex values match exactly: stamp=#C8102E, ink=#0E2436, proceed=#0E9F8B, reduce=#C98A14, wait=#54697E, reject=#C8102E
3. VERDICT_OFFSET values are numeric: PROCEED=0, REDUCE=4.5, WAIT=9, REJECT=15
4. The Verdict type is correctly inferred as "PROCEED" | "REDUCE" | "WAIT" | "REJECT"
5. No syntax errors exist (run TypeScript check on this file only)
6. Comments about Stamp Red discipline are preserved

Run: npx tsc --noEmit src/config/branding.ts and report any errors. If errors exist, fix them and re-verify.
```

---

## Phase 4: Design Tokens in CSS

### Prompt 4.1 — Update globals.css
```
Replace the contents of src/app/globals.css with the complete design tokens from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/app/globals.css. The new file must include:
- @import "tailwindcss" at the top
- :root block with all CSS custom properties (--rtd-ink, --rtd-void, --rtd-stamp, --rtd-proof, --rtd-paper, --rtd-steel, --rtd-proceed, --rtd-reduce, --rtd-wait, --rtd-reject, --rtd-fault-angle, --rtd-rule)
- body rule with background: var(--rtd-proof) and color: var(--rtd-in k)
- code/kbd/samp/pre font-family rule
- .rtd-figure class for monospace figures
- .rtd-fault class for the decorative fault line
- @media (prefers-reduced-motion: reduce) guard

Preserve all comments explaining the design intent. Ensure the fault angle is -12deg.
```

### Audit Prompt 4.1 — CSS Tokens Verification
```
Audit src/app/globals.css. Verify that:
1. All CSS custom properties are defined in :root with correct hex values
2. --rtd-stamp equals #C8102E (Stamp Red)
3. --rtd-fault-angle is exactly -12deg
4. .rtd-figure class sets font-family to var(--font-geist-sans) fallback chain and font-variant-numeric: tabular-nums
5. .rtd-fault class has width: 210px, height: 4px, transform: rotate(-12deg), transform-origin: left center
6. prefers-reduced-motion media query exists and sets animation-duration and transition-duration to 0.01ms
7. No Tailwind utility classes conflict with the custom properties

Run: grep -n "rtd-" src/app/globals.css and count occurrences. Expect at least 15 matches. Report if count is lower.
```

---

## Phase 5: Metadata & Layout Updates

### Prompt 5.1 — Update layout.tsx
```
Replace the contents of src/app/layout.tsx with the complete layout from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/app/layout.tsx. The new file must include:
- Import of BRANDING and COLOR from @/config/branding
- geistSans and geistMono localFont declarations (preserve existing font paths)
- metadata object with metadataBase, title template, description, applicationName, icons, openGraph, twitter
- viewport export with themeColor: COLOR.ink
- RootLayout component returning html with lang="en" and body with antialiased font-sans classes

Ensure metadataBase uses BRANDING.URL and all OpenGraph images reference absolute paths starting with /.
```

### Audit Prompt 5.1 — Metadata Integrity Check
```
Audit src/app/layout.tsx. Verify that:
1. BRANDING and COLOR are imported from @/config/branding
2. metadataBase is set to new URL(BRANDING.URL)
3. title.template includes %s placeholder and BRANDING.SHORT_NAME
4. icons.icon array includes both /favicon.svg and /favicon.ico
5. openGraph.images[0].url is "/og-image.png" with width=1200, height=630
6. twitter.card is "summary_large_image"
7. viewport export exists with themeColor: COLOR.ink
8. RootLayout returns <html> with both geistSans.variable and geistMono.variable in className
9. No hard-coded strings that should use BRANDING constants

Run: npx tsc --noEmit src/app/layout.tsx and report any TypeScript errors. Fix and re-verify if needed.
```

---

## Phase 6: Brand Components Creation

### Prompt 6.1 — Create mark.ts Geometry Engine
```
Create a new file at src/components/brand/mark.ts with the complete geometry engine from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/components/brand/mark.ts. This file must include:
- ANGLE_DEG constant (-12)
- GRID constant (100)
- octagon() function generating 8-point polygon
- faultBasis() function computing unit vectors
- signedDistance() function for point-to-line distance
- clipHalfPlane() function implementing Sutherland-Hodgman algorithm
- translate() and hull() helper functions
- d() function converting points to SVG path data
- MarkSpec interface and SPEC/SPEC_SMALL constants
- markGeometry() function returning blocks and seam paths

Preserve all TypeScript types and comments. This is pure logic—no JSX.
```

### Audit Prompt 6.1 — Geometry Engine Validation
```
Audit src/components/brand/mark.ts. Verify that:
1. All functions are exported (octagon, faultBasis, signedDistance, clipHalfPlane, translate, hull, markGeometry)
2. SPEC and SPEC_SMALL objects have all required properties (outerInset, innerInset, innerChamfer, offset, gap, angle)
3. SPEC_SMALL has larger gap (5 vs 3) for optical correction at small sizes
4. markGeometry() returns object with blocks array and seam string
5. No external dependencies are imported (pure TypeScript)
6. All type annotations are present and valid

Run: npx tsc --noEmit src/components/brand/mark.ts and verify zero errors. Test markGeometry() output by logging result for default spec—expect blocks.length === 2 and seam to be non-empty SVG path data starting with "M ".
```

### Prompt 6.2 — Create Logo.tsx Components
```
Create a new file at src/components/brand/Logo.tsx with the Mark and Lockup components from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/components/brand/Logo.tsx. This file must include:
- "use client" directive at top
- Mark component accepting size, body, fault, offset, title, className props
- Automatic switch to SPEC_SMALL when size <= 32px
- SVG rendering with viewBox="0 0 100 100"
- Lockup component accepting height, reversed, endorsed, className props
- Inline styles for all typography (no Tailwind classes)
- Imports from ./mark and @/config/branding

Preserve the exact inline style calculations (e.g., fontSize: height * 0.42).
```

### Audit Prompt 6.2 — Logo Components Verification
```
Audit src/components/brand/Logo.tsx. Verify that:
1. "use client" directive is present (required for Next.js client components)
2. Mark component switches to SPEC_SMALL when size <= 32
3. SVG has role="img" and aria-label for accessibility
4. Lockup renders BRANDING.ENDORSER in sans face and BRANDING.SHORT_NAME in mono face
5. All styles are inline (style={{...}}), no className references to Tailwind utilities
6. COLOR.stamp is used for fault prop default
7. Both components are exported

Run: npx tsc --noEmit src/components/brand/Logo.tsx and verify zero errors. Check that markGeometry import resolves correctly.
```

### Prompt 6.3 — Create VerdictGlyph.tsx Components
```
Create a new file at src/components/brand/VerdictGlyph.tsx with the verdict-aware components from BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/components/brand/VerdictGlyph.tsx. This file must include:
- "use client" directive
- VerdictGlyph component accepting verdict, size, reversed props
- Uses Mark component with VERDICT_OFFSET[verdict] and VERDICT_COLOR[verdict]
- VerdictBadge component rendering glyph + text label side-by-side
- Imports from ./Logo and @/config/branding
- Mono font for verdict text with letterSpacing: "0.14em"

Preserve the exact verdict color mapping and offset values.
```

### Audit Prompt 6.3 — Verdict Components Validation
```
Audit src/components/brand/VerdictGlyph.tsx. Verify that:
1. VerdictGlyph passes VERDICT_OFFSET[verdict] to Mark's offset prop
2. VerdictGlyph passes VERDICT_COLOR[verdict] to Mark's fault prop
3. VerdictBadge renders verdict text in mono font with 0.14em letter-spacing
4. Both components accept reversed prop for dark backgrounds
5. VERDICT_COLOR and VERDICT_OFFSET are imported from @/config/branding
6. No hard-coded color values (all use VERDICT_COLOR mapping)

Run: npx tsc --noEmit src/components/brand/VerdictGlyph.tsx and verify zero errors. Confirm Verdict type is correctly inferred from branding.ts.
```

---

## Phase 7: Component Wiring

### Prompt 7.1 — Wire Lockup into WorkspaceHeader
```
Read src/components/workspace/WorkspaceHeader.tsx and replace the current title/branding treatment with the <Lockup /> component. Steps:
1. Import { Lockup } from '@/components/brand/Logo'
2. Find the element rendering the product name or logo
3. Replace it with <Lockup height={32} /> or appropriate size
4. Remove any redundant text elements that duplicate the brand name
5. Adjust surrounding flex containers if needed to accommodate the new layout

Preserve all other functionality (navigation, user menu, etc.). Report the exact lines changed.
```

### Audit Prompt 7.1 — WorkspaceHeader Integration Check
```
Audit src/components/workspace/WorkspaceHeader.tsx. Verify that:
1. Lockup is imported from @/components/brand/Logo
2. <Lockup /> component is rendered in the header (likely in the left section)
3. height prop is set appropriately (28–36px range)
4. No duplicate brand name text exists alongside Lockup
5. Header layout remains intact (no broken flex containers)
6. No TypeScript errors in the file

Run: npx tsc --noEmit src/components/workspace/WorkspaceHeader.tsx and verify zero errors. Visually inspect that Lockup appears in the header without layout shifts.
```

### Prompt 7.2 — Wire VerdictBadge into DecisionArtifactView
```
Read src/components/workspace/DecisionArtifactView.tsx and replace the verdict text rendering with <VerdictBadge />. Steps:
1. Import { VerdictBadge } from '@/components/brand/VerdictGlyph'
2. Find where decision.verdict is currently displayed as text
3. Replace the text element with <VerdictBadge verdict={decision.verdict} />
4. Remove any manual color styling that was applied to the verdict text
5. Adjust spacing/margins if needed to accommodate the badge's intrinsic gap

This is the highest-value change—the logo now carries semantic meaning. Report exact lines changed.
```

### Audit Prompt 7.2 — DecisionArtifactView Integration Check
```
Audit src/components/workspace/DecisionArtifactView.tsx. Verify that:
1. VerdictBadge is imported from @/components/brand/VerdictGlyph
2. <VerdictBadge verdict={decision.verdict} /> replaces plain text rendering
3. No manual color classes (text-red-500, etc.) remain on verdict display
4. The badge displays the correct color based on verdict (PROCEED=teal, REDUCE=amber, WAIT=steel, REJECT=red)
5. Spacing around the badge is appropriate (not cramped or overly loose)

Run: npx tsc --noEmit src/components/workspace/DecisionArtifactView.tsx and verify zero errors. If possible, render the component with sample decisions for each verdict and screenshot the results.
```

### Prompt 7.3 — Optional: Animate Mark in AnalysisProgressView
```
Read src/components/workspace/AnalysisProgressView.tsx and add optional animation of the Mark component's offset during stress test execution. Steps:
1. Import { Mark } from '@/components/brand/Logo' and { REF_OFFSET } from '@/config/branding'
2. Add state for animating offset: const [offset, setOffset] = useState(0)
3. During analysis progress, animate offset from 0 to REF_OFFSET using requestAnimationFrame or CSS transitions
4. On completion, set offset to VERDICT_OFFSET[verdict] for final state
5. Wrap animation in prefers-reduced-motion check using window.matchMedia

This is optional but creates a powerful moment where the logo literally shears as risk is discovered. Report implementation approach and exact lines changed.
```

### Audit Prompt 7.3 — Animation Implementation Check
```
Audit src/components/workspace/AnalysisProgressView.tsx (if implemented). Verify that:
1. Mark component is rendered with dynamic offset prop
2. Animation runs only during analysis progress (not before or after)
3. Final offset matches VERDICT_OFFSET[computedVerdict]
4. prefers-reduced-motion is respected (animation disabled if user prefers reduced motion)
5. No performance issues (animation uses GPU-accelerated transforms, not layout thrashing)

Run: npx tsc --noEmit src/components/workspace/AnalysisProgressView.tsx and verify zero errors. Test with Chrome DevTools Performance tab to ensure animation stays above 55fps.
```

---

## Phase 8: README & Documentation Updates

### Prompt 8.1 — Update README.md with Banner
```
Read README.md and add the brand banner at the top. Steps:
1. Insert ![Bitget AI RedTeam Desk](./public/readme-banner.png) as the first line
2. If an existing # Bitget AI RedTeam Desk heading exists below, keep it or remove it (banner contains wordmark)
3. Ensure the image path is correct relative to README.md location
4. Optionally update the repo description in GitHub Settings to match BRANDING.TAGLINE

Report the exact changes made to README.md.
```

### Audit Prompt 8.1 — README Verification
```
Audit README.md. Verify that:
1. Banner image is the first element in the file
2. Image path is ./public/readme-banner.png (correct relative path)
3. Banner renders correctly on GitHub (preview the file)
4. No broken image links exist elsewhere in README
5. Repo social preview is updated in GitHub Settings (manual step—confirm user completed it)

Manually visit the GitHub repo page and confirm the banner displays at the top of README.
```

---

## Phase 9: Full Build & Type Check

### Prompt 9.1 — Run Complete Type Check
```
Run the full TypeScript type check across the entire project:
1. Execute: npm run typecheck (or npx tsc --noEmit if no script exists)
2. Collect all errors related to brand files (branding.ts, mark.ts, Logo.tsx, VerdictGlyph.tsx)
3. Fix any type mismatches, missing imports, or incorrect prop types
4. Re-run until zero errors remain

Report the number of errors found initially and confirm final clean build.
```

### Audit Prompt 9.1 — Type Check Certification
```
Certify the TypeScript build. Verify that:
1. npm run typecheck completes with exit code 0
2. Zero errors reported for brand-related files
3. No implicit any errors in mark.ts or Logo.tsx
4. Verdict type is correctly inferred throughout the codebase
5. All imports resolve correctly (@/config/branding, @/components/brand/*)

Run: npm run typecheck 2>&1 | tee typecheck.log and grep -i "error" typecheck.log. Expect zero matches. If errors exist, fix them and re-run.
```

### Prompt 9.2 — Run Linter
```
Run the ESLint linter across the project:
1. Execute: npm run lint
2. Fix any warnings or errors related to brand files (unused vars, missing React hooks, etc.)
3. Pay special attention to React best practices in Logo.tsx and VerdictGlyph.tsx
4. Re-run until clean

Report lint warnings found and confirm resolution.
```

### Audit Prompt 9.2 — Lint Certification
```
Certify the ESLint build. Verify that:
1. npm run lint completes with exit code 0
2. Zero errors or warnings in brand files
3. No react-hooks/exhaustive-deps warnings in client components
4. No unused variable warnings in mark.ts
5. All JSX follows project conventions

Run: npm run lint 2>&1 | tee lint.log and grep -E "(error|warning)" lint.log. Expect zero matches for brand files. If warnings exist, fix them and re-run.
```

### Prompt 9.3 — Run Production Build
```
Run the full production build:
1. Execute: npm run build
2. Monitor for any build-time errors (missing exports, circular dependencies, etc.)
3. Verify the build completes successfully and outputs to .next/
4. Check bundle size impact of brand components (should be minimal—mark.ts is ~3KB gzipped)

Report build duration and any warnings.
```

### Audit Prompt 9.3 — Build Certification
```
Certify the production build. Verify that:
1. npm run build completes with exit code 0
2. Output directory .next/ exists and contains optimized bundles
3. No critical warnings about missing exports or failed optimizations
4. Brand components are tree-shaken correctly (only used exports included)
5. Build time is within acceptable range (<60 seconds for typical project)

Run: npm run build 2>&1 | tee build.log and grep -i "error" build.log. Expect zero matches. Check .next/static/chunks/ for brand-related chunks and verify they are small (<10KB each).
```

---

## Phase 10: Runtime Verification

### Prompt 10.1 — Start Dev Server & Smoke Test
```
Start the development server and perform smoke tests:
1. Execute: npm run dev (on available port, typically 3000)
2. Navigate to the workspace page in browser
3. Verify Lockup appears in WorkspaceHeader with correct colors
4. Navigate to a decision detail page and verify VerdictBadge renders with correct color per verdict
5. Check browser console for any React warnings or hydration errors

Report visual observations and any console errors.
```

### Audit Prompt 10.1 — Visual Regression Check
```
Audit the running application. Verify that:
1. Lockup component displays in header with correct proportions (endorsed text above short name)
2. Stamp Red (#C8102E) appears ONLY in the mark's fault line, nowhere else
3. VerdictBadge shows correct colors: PROCEED=#0E9F8B (teal), REDUCE=#C98A14 (amber), WAIT=#54697E (steel), REJECT=#C8102E (red)
4. Typography matches brand guidelines (sans for endorser, mono for product name and verdicts)
5. No layout shifts or overflow issues in header or decision views

Take screenshots of WorkspaceHeader and DecisionArtifactView for each verdict. Compare against brand mockups in 03_Mockups/ directory.
```

### Prompt 10.2 — Accessibility Audit
```
Run accessibility checks on the branded components:
1. Use axe DevTools or Lighthouse Accessibility audit
2. Verify Lockup has proper aria-label (BRANDING.SHORT_NAME)
3. Verify VerdictBadge has sufficient color contrast (WCAG AA minimum)
4. Verify SVG in Mark has role="img" and descriptive aria-label
5. Check keyboard navigation still works in header

Report accessibility score and any violations.
```

### Audit Prompt 10.2 — Accessibility Certification
```
Certify accessibility compliance. Verify that:
1. Lighthouse Accessibility score is 100
2. All SVG elements have role="img" and aria-label attributes
3. Color contrast ratios meet WCAG AA: normal text ≥4.5:1, large text ≥3:1
4. Focus indicators are visible and follow brand colors (not default browser blue)
5. Screen reader announces "Bitget AI RedTeam Desk" when encountering Lockup

Run: Lighthouse CLI or Chrome DevTools Lighthouse tab. Document scores: Performance, Accessibility, Best Practices, SEO. All should be ≥90.
```

---

## Phase 11: Performance & PWA Verification

### Prompt 11.1 — Performance Audit
```
Run performance benchmarks:
1. Use Lighthouse Performance audit in Chrome
2. Measure First Contentful Paint, Largest Contentful Paint, Cumulative Layout Shift
3. Verify brand assets (SVG logos) are optimized and don't block rendering
4. Check that mark.ts geometry computation doesn't cause jank (should be <1ms per render)
5. Verify CSS custom properties don't cause style recalculation overhead

Report performance metrics and any regressions from baseline.
```

### Audit Prompt 11.1 — Performance Certification
```
Certify performance standards. Verify that:
1. Lighthouse Performance score ≥90
2. FCP <1.5s, LCP <2.5s, CLS <0.1
3. SVG logos are inline or cached (no repeated network requests)
4. markGeometry() execution time <1ms per call (profile in DevTools)
5. No layout thrashing from dynamic offset animations

Run: Lighthouse CLI with --only-categories=performance. Compare scores to pre-integration baseline. If regression >5 points, investigate brand-related code.
```

### Prompt 11.2 — PWA Installability Check
```
Verify PWA configuration:
1. Check that manifest.webmanifest is served from /manifest.webmanifest
2. Verify manifest contains correct name, icons, and start_url
3. Test PWA install prompt appears on supported devices (Chrome desktop/mobile)
4. Verify service worker registration (if applicable)
5. Test offline functionality with brand assets cached

Report PWA installability status.
```

### Audit Prompt 11.2 — PWA Certification
```
Certify PWA compliance. Verify that:
1. manifest.webmanifest is accessible at /manifest.webmanifest
2. Manifest contains name: "Bitget AI RedTeam Desk", short_name: "RedTeam Desk"
3. All icon sizes are present (192x192, 512x512, maskable)
4. PWA install prompt appears in Chrome on desktop and mobile
5. Installed app displays Lockup as splash screen (configured in manifest)

Test: Open Chrome DevTools → Application → Manifest. Verify all fields. Test install flow on Android device or Chrome desktop.
```

---

## Phase 12: Final Integration Report

### Prompt 12.1 — Generate Integration Summary
```
Generate a comprehensive integration summary document. Include:
1. List of all files modified or created
2. Git diff summary (lines added/removed per file)
3. Before/after screenshots of WorkspaceHeader and DecisionArtifactView
4. Performance metrics comparison (pre/post integration)
5. Accessibility audit results
6. Any remaining TODOs or optional enhancements

Save as INTEGRATION_COMPLETE.md in the project root.
```

### Audit Prompt 12.1 — Final Verification
```
Perform final verification before considering integration complete:
1. All 12 phases executed successfully with passing audits
2. Zero TypeScript errors, zero lint warnings, clean production build
3. Visual regression tests pass (brand colors, typography, spacing)
4. Accessibility score = 100, Performance score ≥90
5. PWA installable and functional
6. Documentation updated (README.md, INTEGRATION_COMPLETE.md)

If any check fails, return to the failing phase and re-execute. Do not mark integration complete until all audits pass.
```

---

## Emergency Rollback Procedure

If any phase fails catastrophically:

```
Execute emergency rollback:
1. git stash push -u -m "brand-integration-attempt"
2. git checkout HEAD -- src/config/branding.ts src/app/globals.css src/app/layout.tsx
3. rm -rf src/components/brand/
4. rm -rf public/ (if it didn't exist before)
5. git stash pop (restore unrelated changes)
6. Verify project builds cleanly: npm run build
7. Document failure reason in ROLLBACK_REPORT.md

Only proceed with rollback if multiple re-attempts of a phase fail. Report exact error messages and stack traces.
```

---

## Success Criteria Checklist

Integration is complete when ALL items are verified:

- [ ] Static assets copied to public/ (9 files)
- [ ] branding.ts replaced with full token suite
- [ ] globals.css updated with design tokens
- [ ] layout.tsx updated with metadata
- [ ] src/components/brand/ created with mark.ts, Logo.tsx, VerdictGlyph.tsx
- [ ] Lockup wired into WorkspaceHeader.tsx
- [ ] VerdictBadge wired into DecisionArtifactView.tsx
- [ ] README.md updated with banner
- [ ] TypeScript typecheck passes (0 errors)
- [ ] ESLint passes (0 warnings in brand files)
- [ ] Production build succeeds
- [ ] Visual verification passed (all verdicts render correctly)
- [ ] Accessibility score = 100
- [ ] Performance score ≥90
- [ ] PWA installable
- [ ] Stamp Red used ONLY for logo fault and REJECT verdict

---

**Document Version:** 1.0  
**Last Updated:** September 20, 2026  
**Maintainer:** Bitget AI RedTeam Desk Engineering

</content>