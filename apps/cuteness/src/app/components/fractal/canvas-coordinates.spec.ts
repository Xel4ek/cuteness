import { describe, expect, it } from 'vitest';
import { getCanvasCoordinates } from './canvas-coordinates';

describe('canvas input coordinates', () => {
  const canvas = { getBoundingClientRect: () => new DOMRect(10, 20, 200, 100) };

  it('preserves mouse offsets, including zero', () => {
    expect(getCanvasCoordinates({ offsetX: 0, offsetY: 50 }, canvas)).toEqual({ offsetX: 0, offsetY: 50 });
  });

  it('converts an active touch to canvas offsets', () => {
    expect(getCanvasCoordinates({ touches: [{ clientX: 40, clientY: 70 }], changedTouches: [] }, canvas)).toEqual({
      offsetX: 30,
      offsetY: 50,
    });
  });

  it('uses the released touch when touchend has no active touches', () => {
    expect(getCanvasCoordinates({ touches: [], changedTouches: [{ clientX: 40, clientY: 70 }] }, canvas)).toEqual({
      offsetX: 30,
      offsetY: 50,
    });
  });

  it('ignores touch events without any coordinates', () => {
    expect(getCanvasCoordinates({ touches: [], changedTouches: [] }, canvas)).toBeNull();
  });
});
