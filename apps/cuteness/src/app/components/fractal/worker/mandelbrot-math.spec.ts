import { describe, expect, it } from 'vitest';
import { fixedFromDecimal, pointAt } from '../fractal-viewport';
import { buildReference, escapeIterations, referencesInView } from './mandelbrot-math';

function point(re: string, im: string, precision = 512) {
  return { re: fixedFromDecimal(re, precision), im: fixedFromDecimal(im, precision), precision };
}

describe('high precision Mandelbrot reference', () => {
  it('classifies known interior and escaping orbits', () => {
    expect(escapeIterations(point('0', '0'), 100)).toBe(100);
    expect(escapeIterations(point('-1', '0'), 100)).toBe(100);
    expect(escapeIterations(point('1', '0'), 100)).toBe(3);
    expect(escapeIterations(point('2', '0'), 100)).toBe(2);
  });

  it('distinguishes points on either side of -2 beyond floating point precision', () => {
    const precision = 4096;
    const center = -2n << BigInt(precision);
    const delta = fixedFromDecimal('1e-1000', precision);
    expect(escapeIterations({ re: center - delta, im: 0n, precision }, 2000)).toBe(1);
    expect(escapeIterations({ re: center + delta, im: 0n, precision }, 2000)).toBe(2000);
  });

  it('builds only the initial orbit sample when the iteration limit is zero', () => {
    const reference = buildReference(point('1', '0'), 0);
    expect(reference.iterations).toBe(0);
    expect(reference.length).toBe(1);
    expect(reference.samples.length).toBe(8);
  });

  it('retains the tiny escape-radius difference in a GPU reference orbit', () => {
    const reference = buildReference(point('-2.0000000000000000000000000000000000000001', '0'), 100);
    expect(reference.length).toBe(2);
    const gap = reference.samples.subarray(12, 16);
    expect(gap?.[0]).toBeGreaterThan(0);
    expect(gap?.[2]).toBeLessThan(-100);
  });

  it('returns the exact iteration count for the reference pixel', () => {
    for (const coordinates of [
      point('0', '0'),
      point('1', '0'),
      point('-2.0000000000000000000000000000000000000001', '0'),
    ]) {
      const reference = buildReference(coordinates, 100);
      expect(reference.iterations).toBe(escapeIterations(coordinates, 100));
    }
  });

  it('keeps the exact reference position and its iteration limit for reuse', () => {
    const coordinates = point('-0.743643887037151', '0.13182590420533');
    const reference = buildReference(coordinates, 100);
    expect(reference.point).toEqual(coordinates);
    expect(reference.maximum).toBe(100);
  });

  it('reuses orbits inside the current view but discards incompatible cached work', () => {
    const view = { centerRe: 0n, centerIm: 0n, span: fixedFromDecimal('3', 128), precision: 128 };
    const reference = buildReference(pointAt(view, 800, 600, 400.5, 300.5), 100);
    expect(referencesInView([reference], view, 800, 600, 100)).toEqual([reference]);
    expect(referencesInView([reference], { ...view, centerRe: fixedFromDecimal('0.5', 128) }, 800, 600, 100)).toEqual([
      reference,
    ]);
    expect(referencesInView([reference], { ...view, centerRe: fixedFromDecimal('4', 128) }, 800, 600, 100)).toEqual([]);
    expect(referencesInView([reference], view, 800, 600, 200)).toEqual([]);
    expect(referencesInView([reference], { ...view, precision: 192, span: view.span << 64n }, 800, 600, 100)).toEqual(
      [],
    );
  });

  it('checks cached positions in fixed point even when floating coordinates would coincide', () => {
    const view = {
      centerRe: fixedFromDecimal('-2', 4096),
      centerIm: 0n,
      span: fixedFromDecimal('1e-1000', 4096),
      precision: 4096,
    };
    const reference = buildReference(pointAt(view, 20, 20, 10.5, 10.5), 100);
    expect(referencesInView([reference], view, 20, 20, 100)).toEqual([reference]);
    expect(referencesInView([reference], { ...view, centerRe: view.centerRe + view.span * 2n }, 20, 20, 100)).toEqual(
      [],
    );
  });
});
