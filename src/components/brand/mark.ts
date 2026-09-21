/**
 * The mark, computed.
 *
 * Ported from the identity's geometry engine so the product can render the
 * logo at any displacement — including animating it as a stress test runs.
 * Nothing here is a traced path; the artwork is derived every time.
 */

export const ANGLE_DEG = -12;
export const GRID = 100;

type Pt = [number, number];

function octagon(inset: number, chamfer: number): Pt[] {
  const a = inset;
  const b = GRID - inset;
  const c = chamfer;
  return [
    [a + c, a], [b - c, a],
    [b, a + c], [b, b - c],
    [b - c, b], [a + c, b],
    [a, b - c], [a, a + c],
  ];
}

function faultBasis(angleDeg = ANGLE_DEG) {
  const r = (angleDeg * Math.PI) / 180;
  return {
    u: [Math.cos(r), Math.sin(r)] as Pt,
    n: [-Math.sin(r), Math.cos(r)] as Pt,
  };
}

function signedDistance(p: Pt, angleDeg: number, centre: Pt = [50, 50]) {
  const { n } = faultBasis(angleDeg);
  return (p[0] - centre[0]) * n[0] + (p[1] - centre[1]) * n[1];
}

/** Sutherland–Hodgman clip against the fault plane, shifted by `offset`. */
function clipHalfPlane(poly: Pt[], keepNegative: boolean, offset: number,
                       angleDeg: number): Pt[] {
  const value = (p: Pt) => signedDistance(p, angleDeg) - offset;
  const inside = (p: Pt) => (keepNegative ? value(p) <= 0 : value(p) >= 0);
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % poly.length];
    const ci = inside(cur);
    const ni = inside(nxt);
    const cross = (): Pt => {
      const vp = value(cur);
      const vq = value(nxt);
      const t = vp / (vp - vq);
      return [cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])];
    };
    if (ci) {
      out.push(cur);
      if (!ni) out.push(cross());
    } else if (ni) {
      out.push(cross());
    }
  }
  return out;
}

function translate(poly: Pt[], dx: number, dy: number): Pt[] {
  return poly.map(([x, y]) => [x + dx, y + dy] as Pt);
}

function hull(points: Pt[]): Pt[] {
  const seen = new Set<string>();
  const pts: Pt[] = [];
  for (const [x, y] of points) {
    const rx = Math.round(x * 1e4) / 1e4;
    const ry = Math.round(y * 1e4) / 1e4;
    const key = `${rx},${ry}`;
    if (!seen.has(key)) {
      seen.add(key);
      pts.push([rx, ry]);
    }
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const chain = (seq: Pt[]) => {
    const out: Pt[] = [];
    for (const q of seq) {
      while (out.length >= 2) {
        const a = out[out.length - 2];
        const b = out[out.length - 1];
        if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) <= 0) out.pop();
        else break;
      }
      out.push(q);
    }
    return out;
  };
  const lower = chain(pts);
  const upper = chain([...pts].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const d = (poly: Pt[]) =>
  "M " + poly.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L ") + " Z";

export interface MarkSpec {
  outerInset: number;
  innerInset: number;
  innerChamfer: number;
  offset: number;
  gap: number;
  angle: number;
}

export const SPEC: MarkSpec = {
  outerInset: 6, innerInset: 26, innerChamfer: 11,
  offset: 9, gap: 3, angle: ANGLE_DEG,
};

/** Heavier seam for anything rendered at or below 32px. */
export const SPEC_SMALL: MarkSpec = {
  outerInset: 5, innerInset: 27, innerChamfer: 10,
  offset: 9, gap: 5, angle: ANGLE_DEG,
};

export interface MarkGeometry {
  blocks: { outer: string; inner: string }[];
  seam: string;
}

export function markGeometry(spec: Partial<MarkSpec> = {}): MarkGeometry {
  const s = { ...SPEC, ...spec };
  const outer = octagon(s.outerInset, 18);
  const inner = octagon(s.innerInset, s.innerChamfer);
  const { u } = faultBasis(s.angle);
  const half = s.gap / 2;
  const blocks: { outer: string; inner: string }[] = [];
  let all: Pt[] = [];

  for (const [keep, sign] of [[true, 1], [false, -1]] as [boolean, number][]) {
    const off = keep ? -half : half;
    const oc = translate(clipHalfPlane(outer, keep, off, s.angle),
                         s.offset * u[0] * sign, s.offset * u[1] * sign);
    const ic = translate(clipHalfPlane(inner, keep, off, s.angle),
                         s.offset * u[0] * sign, s.offset * u[1] * sign);
    blocks.push({ outer: d(oc), inner: d(ic) });
    all = all.concat(oc);
  }

  const h = hull(all);
  const seam = d(clipHalfPlane(clipHalfPlane(h, true, half, s.angle),
                               false, -half, s.angle));
  return { blocks, seam };
}
