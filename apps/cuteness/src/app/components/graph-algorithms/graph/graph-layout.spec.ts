import { describe, expect, it } from 'vitest';

import { layoutByCost } from './graph-layout';

describe('graph layout by travel cost', () => {
  const distance = (positions: ReturnType<typeof layoutByCost>, from: number, to: number) =>
    Math.hypot(
      positions[from].x - positions[to].x,
      positions[from].y - positions[to].y,
      positions[from].z - positions[to].z,
    );

  it('fits a consistent cost matrix while preserving the input and repeatable positions', () => {
    const matrix = [
      [0, 1, Math.SQRT2, 1],
      [1, 0, 1, Math.SQRT2],
      [Math.SQRT2, 1, 0, 1],
      [1, Math.SQRT2, 1, 0],
    ];
    const before = structuredClone(matrix);
    const positions = layoutByCost(matrix);
    const side = distance(positions, 0, 1);
    expect(distance(positions, 0, 2) / side).toBeCloseTo(Math.SQRT2, 2);
    expect(distance(positions, 1, 2) / side).toBeCloseTo(1, 2);
    expect(layoutByCost(matrix)).toEqual(positions);
    expect(matrix).toEqual(before);
  });

  it('uses the minimum of available directions without treating an absent road as a free road', () => {
    const directed = [
      [0, 2, 0],
      [6, 0, 3],
      [8, 0, 0],
    ];
    const symmetric = [
      [0, 2, 8],
      [2, 0, 3],
      [8, 3, 0],
    ];
    expect(layoutByCost(directed)).toEqual(layoutByCost(symmetric));
    const positions = layoutByCost(directed);
    expect(distance(positions, 0, 2)).toBeGreaterThan(distance(positions, 1, 2));
  });

  it('keeps missing and isolated nodes finite and distinct', () => {
    for (const matrix of [
      [],
      [[0]],
      [
        [0, 0],
        [0, 0],
      ],
      [
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
    ]) {
      const positions = layoutByCost(matrix);
      expect(positions).toHaveLength(matrix.length);
      expect(positions.every(({ x, y, z }) => Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))).toBe(
        true,
      );
      expect(new Set(positions.map(({ x, y, z }) => `${x},${y},${z}`)).size).toBe(matrix.length);
    }
  });

  it('uses a third dimension for four cities with equal pairwise costs', () => {
    const positions = layoutByCost(
      Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => Number(i !== j))),
    );
    const side = distance(positions, 0, 1);
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        expect(distance(positions, i, j) / side).toBeCloseTo(1, 2);
      }
    }
  });
});
