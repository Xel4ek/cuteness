import { FractalPoint, FractalView, pointAt, scaledParts } from '../fractal-viewport';

export interface ReferenceOrbit {
  point: FractalPoint;
  maximum: number;
  samples: Float32Array;
  length: number;
  iterations: number;
}

export function escapeIterations(point: FractalPoint, maximum: number): number {
  const shift = BigInt(point.precision);
  const escapeRadius = 4n << (shift * 2n);
  let re = 0n;
  let im = 0n;

  for (let i = 0; i < maximum; i++) {
    const rr = re * re;
    const ii = im * im;

    if (rr + ii > escapeRadius) {
      return i;
    }

    im = ((2n * re * im) >> shift) + point.im;
    re = ((rr - ii) >> shift) + point.re;
  }

  return maximum;
}

/** Each sample holds scaled Z and scaled (|Z|^2 - 4), two vec4f values. */
export function buildReference(point: FractalPoint, maximum: number): ReferenceOrbit {
  const samples = new Float32Array((maximum + 1) * 8);
  const shift = BigInt(point.precision);
  const escapeRadius = 4n << (shift * 2n);
  let re = 0n;
  let im = 0n;

  for (let i = 0; ; i++) {
    const rr = re * re;
    const ii = im * im;
    const gap = rr + ii - escapeRadius;
    samples.set(scaledParts(re, im, point.precision), i * 8);
    samples.set(scaledParts(gap, 0n, point.precision * 2), i * 8 + 4);

    if (gap > 0n || i === maximum) {
      return { point, maximum, samples: samples.slice(0, (i + 1) * 8), length: i + 1, iterations: i };
    }

    im = ((2n * re * im) >> shift) + point.im;
    re = ((rr - ii) >> shift) + point.re;
  }
}

/** Reuse only orbits whose precision, iteration limit and position still fit the view. */
export function referencesInView(references: ReferenceOrbit[], view: FractalView, width: number, height: number, maximum: number): ReferenceOrbit[] {
  const origin = pointAt(view, width, height, 0, 0);
  const end = pointAt(view, width, height, width, height);

  return references.filter(
    ({ point, maximum: limit }) =>
      limit === maximum && point.precision === origin.precision && point.re >= origin.re && point.re <= end.re && point.im >= origin.im && point.im <= end.im,
  );
}
