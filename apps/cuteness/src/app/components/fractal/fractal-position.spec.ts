import { describe, expect, it } from 'vitest';
import { centerLabels, copyPosition, fixedToDecimal, parsePosition, positionLink } from './fractal-position';
import { fixedFromDecimal, fixedToNumber, FractalViewport } from './fractal-viewport';
import { compressToEncodedURIComponent } from 'lz-string';

describe('fractal center coordinates', () => {
  it('shares exact positions in full links while preserving the domain, deployment path and other parameters', () => {
    const view = {
      centerRe: fixedFromDecimal('-0.74543', 4096) + 1n,
      centerIm: fixedFromDecimal('0.113008', 4096),
      span: fixedFromDecimal('1e-1000', 4096),
      precision: 4096,
    };
    for (const base of ['http://localhost:4200/fractal', 'https://example.com/cuteness/fractal?other=1&position=old']) {
      const link = positionLink(view, 3800, base);
      const url = new URL(link);
      expect(url.origin).toBe(new URL(base).origin);
      expect(url.pathname).toBe(new URL(base).pathname);
      expect(url.searchParams.get('other')).toBe(new URL(base).searchParams.get('other'));
      expect(url.searchParams.getAll('position')).toHaveLength(1);
      expect(parsePosition(link)).toEqual({ coordinates: view, maxIteration: 3800 });
    }
  });

  it('restores copied coordinates and zoom exactly, including deep zoom and the overview limit', () => {
    for (const precision of [128, 4096]) {
      for (const span of [1n, 6n << BigInt(precision), fixedFromDecimal('0.003', precision)]) {
        const view = {
          centerRe: fixedFromDecimal('-0.74543', precision) + 1n,
          centerIm: -1n,
          span,
          precision,
        };
        for (const maxIteration of [100, 3800, 50000]) {
          const text = copyPosition(view, maxIteration);
          expect(text).toMatch(/^fractal:1:[\w+$-]+$/);
          expect(parsePosition(text)).toEqual({ coordinates: view, maxIteration });
          expect(parsePosition(` \n${text}\n `)).toEqual({ coordinates: view, maxIteration });
        }
      }
    }
  });

  it('rejects unrelated clipboard text and invalid or excessive numeric values', () => {
    const text = 'Re: -0.74543\nIm: 0.113008\nZoom: 1000\nPrecision: 128';
    for (const invalid of [
      '',
      'some other text',
      text.replace(/Precision: .*/, 'Precision: 0'),
      text.replace(/Precision: .*/, 'Precision: 1000000000'),
      text.replace(/Zoom: .*/, 'Zoom: 0'),
      text.replace(/Zoom: .*/, 'Zoom: 0.49'),
      text.replace(/Zoom: .*/, 'Zoom: Infinity'),
      text.replace(/Re: .*/, 'Re: 0xff'),
      text.replace(/Im: .*/, 'Im: NaN'),
      'x'.repeat(1000001),
      'fractal:1:',
      'fractal:1:not valid!',
      'fractal:1:broken',
      'fractal:2:unsupported',
      'http://[invalid',
      'https://example.com/fractal',
      'https://example.com/fractal?position=invalid',
      ...[
        '0|2000|0|0|1',
        '1000000000|2000|0|0|1',
        '128|0|0|0|1',
        '128|50001|0|0|1',
        '128|2000|0|0|0',
        '128|2000|0|0|ffffffffffffffffffffffffffffffffffffff',
        '128|2000|no-hex|0|1',
      ].map((value) => `fractal:1:${compressToEncodedURIComponent(value)}`),
    ]) {
      expect(parsePosition(invalid)).toBeUndefined();
    }
  });

  it('accepts old plain-text positions without replacing the current iteration setting', () => {
    const text = 'Re: -0.74543\nIm: 0.113008\nZoom: 1000\nPrecision: 128';
    expect(parsePosition(text)?.maxIteration).toBeUndefined();
    expect(parsePosition(text)?.coordinates).toEqual({
      centerRe: fixedFromDecimal('-0.74543', 128),
      centerIm: fixedFromDecimal('0.113008', 128),
      span: fixedFromDecimal('0.003', 128),
      precision: 128,
    });
    expect(parsePosition(text.replaceAll('\n', '\r\n'))).toEqual(parsePosition(text));
  });

  it('formats signed fixed-point numbers without negative zero or unnecessary trailing zeros', () => {
    expect(fixedToDecimal(-20n, 4)).toBe('-1.25');
    expect(fixedToDecimal(16n, 4)).toBe('1');
    expect(fixedToDecimal(-1n, 128, 6)).toBe('0');
  });

  it('copies coordinates with enough decimal digits to preserve the exact stored position', () => {
    for (const precision of [128, 4096]) {
      for (const value of [fixedFromDecimal('-0.74543', precision), 1n, -(2n << BigInt(precision)) - 1n]) {
        const text = fixedToDecimal(value, precision);
        expect(fixedFromDecimal(text, precision)).toBe(value);
        expect(text).not.toContain('…');
      }
    }
  });

  it('shows readable coordinates for the initial view', () => {
    expect(centerLabels(new FractalViewport().snapshot(), 1280)).toEqual({ re: '-0.7445043101', im: '0.1165212693' });
  });

  it('keeps deep movement visible while shortening long coordinates in the middle', () => {
    const view = {
      centerRe: fixedFromDecimal('-0.74543', 4096),
      centerIm: 0n,
      span: fixedFromDecimal('1e-1000', 4096),
      precision: 4096,
    };
    const moved = { ...view, centerRe: view.centerRe + view.span / 1000n };
    const before = centerLabels(view, 1000);
    const after = centerLabels(moved, 1000);
    expect(fixedToNumber(view.centerRe, view.precision)).toBe(fixedToNumber(moved.centerRe, moved.precision));
    expect(after.re).not.toBe(before.re);
    expect(after.re).toContain('…');
    expect(after.re.length).toBeLessThanOrEqual(24);
    expect(after.im).toBe('0');
  });
});
