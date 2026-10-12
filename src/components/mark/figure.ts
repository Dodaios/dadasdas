/**
 * The Dodaios mark as geometry: the hooded figure, read from the logo file.
 *
 * `src/assets/dodaios-logo.svg` is the app's own logo, copied unchanged from
 * `assets/brand/dodaios-logo.svg` in the app repository. Its one path is
 * parsed here rather than retyped, so the site and the product carry one mark
 * instead of two that drift: replace the file and the relief follows.
 *
 * The file is a tracing: a single path of straight segments (`M`, `L`, `Z`)
 * in a 256-unit viewBox, filled even-odd. Three of its rings are solids — the
 * hood and cape, the body, the near foot — and three sit inside the body: the
 * two eyes and the sliver of lining beside the face. A ring that starts inside another ring
 * is that ring's hole; nothing in the file nests deeper than that.
 *
 * `y` is negated throughout because SVG counts downwards and three.js does not.
 *
 * ## Holes, not accents
 *
 * The raster turns brightness into dot density, so on this page black is not a
 * colour — it is absent ink. The logo is one flat shape with openings, and it
 * is extruded exactly as that: the eyes are cut through, and the page shows
 * through them. Nothing is laid on the face, so the mark has no second
 * material and reads the same from the back of the turn, mirrored.
 */

import { ExtrudeGeometry, Path, Shape, type BufferGeometry } from "three";

import logoSvg from "@/assets/dodaios-logo.svg?raw";

/** The logo's viewBox is 256 units tall, and the figure spans all of it. */
const SVG_HEIGHT = 256;

/**
 * Deep enough that the mark still reads as a solid object when the turn
 * carries it past its own edge. A shallower slab flickers into a line there.
 */
const DEPTH = 0.22 * SVG_HEIGHT;

/**
 * A small roll between the face and the flank, taken INSIDE the outline.
 *
 * three.js grows a bevelled shape outwards by `bevelSize`, and this drawing
 * cannot afford that: the hood, the body and the foot are separated by gaps a
 * few units wide, and an outward bevel closes them into one blob. The negative
 * offset pulls the outline in by the same amount first, so the silhouette at
 * mid-depth is the logo's own and the gaps stay open.
 */
const BEVEL = 0.007 * SVG_HEIGHT;

type Ring = [number, number][];

/** The path's rings, in file order. Anything but `M`/`L`/`Z` is a new file. */
function parseRings(svg: string): Ring[] {
  const d = /\sd="([^"]+)"/.exec(svg)?.[1];
  if (!d) throw new Error("dodaios-logo.svg has no path data");
  if (/[^MLZ\d\s.,-]/i.test(d)) {
    throw new Error("dodaios-logo.svg uses path commands other than M, L and Z");
  }
  return d
    .split(/z/i)
    .map((ring) => ring.replace(/[ML]/gi, " ").trim())
    .filter(Boolean)
    .map((ring) => {
      const n = ring.split(/[\s,]+/).map(Number);
      const points: Ring = [];
      for (let i = 0; i + 1 < n.length; i += 2) points.push([n[i], n[i + 1]]);
      return points;
    });
}

/** Even-odd point-in-polygon, for telling a hole from a solid. */
function contains(ring: Ring, [px, py]: [number, number]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function trace<T extends Path>(target: T, ring: Ring): T {
  ring.forEach(([x, y], i) => (i === 0 ? target.moveTo(x, -y) : target.lineTo(x, -y)));
  target.closePath();
  return target;
}

export interface MarkParts {
  /** Everything on the paper material. */
  paper: BufferGeometry[];
  /** Everything on the black material. The figure has none: its eyes are holes. */
  accent: BufferGeometry[];
  /** Whose bounding box frames and normalises the mark. */
  bodyIndex: number;
}

/**
 * Build the mark as ONE geometry. The three solids are a single extrusion, so
 * the caller has one bounding box that is the whole figure — hood tip to foot
 * — and one buffer to centre, scale and dispose.
 */
export function buildMark(): MarkParts {
  const rings = parseRings(logoSvg);
  const parentOf = rings.map((ring, i) =>
    rings.findIndex((other, j) => j !== i && contains(other, ring[0])),
  );

  const shapes: Shape[] = [];
  rings.forEach((ring, i) => {
    if (parentOf[i] !== -1) return;
    const shape = trace(new Shape(), ring);
    rings.forEach((hole, j) => {
      if (parentOf[j] === i) shape.holes.push(trace(new Path(), hole));
    });
    shapes.push(shape);
  });

  const figure = new ExtrudeGeometry(shapes, {
    depth: DEPTH - 2 * BEVEL,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
    bevelSegments: 4,
    // The outline is straight segments already; there is no curve to divide.
    curveSegments: 1,
  });

  return { paper: [figure], accent: [], bodyIndex: 0 };
}
