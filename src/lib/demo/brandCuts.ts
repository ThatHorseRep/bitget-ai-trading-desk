/**
 * Single source of truth for the responsive brand-cut demo videos embedded on
 * the landing page (#demo-walkthrough). Both cuts are 100% live-data brand
 * recordings — provenance chain in demo-out/brand-live-timeline.json and
 * docs/PROBLEMS_AND_SOLUTIONS.md.
 *
 * Consumed by src/components/landing/BrandedDemoPlayer.tsx; pinned by
 * tests/brand-cuts.test.cjs.
 */

export const MOBILE_BREAKPOINT_PX = 768;

export interface BrandCut {
  /** Public URL of the h264/mp4 video served from public/demo/. */
  videoSrc: string;
  /** Public URL of the matching poster frame (same stem, .jpg). */
  posterSrc: string;
}

export const BRAND_CUTS: Record<"mobile" | "desktop", BrandCut> = {
  mobile: {
    videoSrc: "/demo/brand-mobile-demo.mp4",
    posterSrc: "/demo/brand-mobile-poster.jpg"
  },
  desktop: {
    videoSrc: "/demo/brand-desktop-demo.mp4",
    posterSrc: "/demo/brand-desktop-poster.jpg"
  }
};

/**
 * Viewport widths strictly below the breakpoint get the portrait mobile cut;
 * widths at or above it get the 1080p desktop cut. Matches the
 * `window.innerWidth < 768` behavior the landing player has always used.
 */
export function getBrandCutForViewport(widthPx: number): BrandCut {
  return widthPx < MOBILE_BREAKPOINT_PX ? BRAND_CUTS.mobile : BRAND_CUTS.desktop;
}
