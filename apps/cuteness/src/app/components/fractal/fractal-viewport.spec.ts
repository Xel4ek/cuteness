import { describe, expect, it } from 'vitest';
import {
  fixedFromDecimal,
  fixedToNumber,
  frameProjection,
  FractalViewport,
  pointAt,
  scaledParts,
} from './fractal-viewport';

const origin = { offsetX: 400, offsetY: 300 };
const overview = { centerRe: -1n << 127n, centerIm: 0n, span: 3n << 128n, precision: 128 };

describe('high precision fractal viewport', () => {
  it('projects an existing frame around the gesture anchor and follows a pan', () => {
    const viewport = new FractalViewport(overview);
    const frame = viewport.snapshot();
    viewport.transform(
      { from: { offsetX: 200, offsetY: 150 }, to: { offsetX: 225, offsetY: 160 }, scale: 0.5 },
      800,
      600,
    );
    const projection = frameProjection(frame, viewport.snapshot(), 800, 600);
    expect(projection.scale).toBe(2);
    expect(projection.x).toBeCloseTo(-175);
    expect(projection.y).toBeCloseTo(-140);
    expect(200 * projection.scale + projection.x).toBeCloseTo(225);
    expect(150 * projection.scale + projection.y).toBeCloseTo(160);
  });

  it('projects tiny viewport changes without rounding their full-size centers', () => {
    const viewport = new FractalViewport(overview);
    for (let i = 0; i < 1200; i++) viewport.transform({ from: origin, to: origin, scale: 0.5 }, 800, 600);
    const frame = viewport.snapshot();
    viewport.transform({ from: origin, to: { offsetX: 425, offsetY: 310 }, scale: 0.5 }, 800, 600);
    const projection = frameProjection(frame, viewport.snapshot(), 800, 600);
    expect(projection.scale).toBeCloseTo(2);
    expect(projection.x).toBeCloseTo(-375, 5);
    expect(projection.y).toBeCloseTo(-290, 5);
  });
  it('parses decimal coordinates without passing through Number', () => {
    const a = fixedFromDecimal('-0.7436438870371510000000000000000000000001', 256);
    const b = fixedFromDecimal('-0.7436438870371510000000000000000000000002', 256);
    expect(a).not.toBe(b);
    expect(fixedToNumber(fixedFromDecimal('1.25e-2', 256), 256)).toBeCloseTo(0.0125);
  });

  it('keeps adjacent pixels distinct after zooming far beyond f64', () => {
    const viewport = new FractalViewport(overview);
    for (let i = 0; i < 1200; i++) viewport.transform({ from: origin, to: origin, scale: 0.5 }, 800, 600);
    const view = viewport.snapshot();
    expect(view.precision).toBeGreaterThan(1200);
    expect(viewport.zoomLabel()).toMatch(/e361$/);
    const a = pointAt(view, 800, 600, 400, 300);
    const b = pointAt(view, 800, 600, 401, 300);
    expect(a.re).not.toBe(b.re);
    expect(fixedToNumber(a.re, a.precision)).toBe(fixedToNumber(b.re, b.precision));
  });

  it('preserves the gesture anchor, pans, and limits zoom-out to 0.5x', () => {
    const viewport = new FractalViewport(overview);
    const before = pointAt(viewport.snapshot(), 800, 600, 200, 150);
    viewport.transform(
      { from: { offsetX: 200, offsetY: 150 }, to: { offsetX: 200, offsetY: 150 }, scale: 0.5 },
      800,
      600,
    );
    const after = pointAt(viewport.snapshot(), 800, 600, 200, 150);
    expect(after).toEqual(before);
    viewport.transform({ from: origin, to: { offsetX: 450, offsetY: 350 }, scale: 1 }, 800, 600);
    expect(viewport.zoomLabel()).toBe('2');
    viewport.transform({ from: origin, to: origin, scale: 100 }, 800, 600);
    expect(viewport.zoomLabel()).toBe('0.5');
  });

  it('retains nonzero scaled deltas even below f64 underflow', () => {
    const parts = scaledParts(1n, -2n, 4000);
    expect(parts[0]).not.toBe(0);
    expect(parts[1]).not.toBe(0);
    expect(parts[2]).toBe(-3999);
    expect(fixedToNumber(3n << 5000n, 5000)).toBe(3);
  });
});
