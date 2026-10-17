import { afterEach, describe, expect, it, vi } from 'vitest';

import { GraphAlgorithms, type TsmResult } from './graph-algorithms';

function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;

    return state / 2 ** 32;
  };
}

function boundedRandom(seed: number, maxCalls: number): () => number {
  const random = seededRandom(seed);
  let calls = 0;

  return () => {
    if (calls++ >= maxCalls) {
      throw new Error(`GA exceeded the random-call budget of ${maxCalls}`);
    }

    return random();
  };
}

function assertHamiltonianCycle(matrix: number[][], result: TsmResult, expectedDistance?: number) {
  expect(result.vertices).toHaveLength(matrix.length + 1);
  expect(result.vertices[0]).toBe(result.vertices.at(-1));
  expect(new Set(result.vertices.slice(0, -1))).toEqual(new Set(Array.from({ length: matrix.length }, (_, index) => index)));

  const distance = result.vertices.slice(1).reduce((total, to, index) => {
    const weight = matrix[result.vertices[index]][to];
    expect(weight).toBeGreaterThan(0);

    return total + weight;
  }, 0);

  expect(result.distance).toBe(distance);

  if (expectedDistance !== undefined) {
    expect(result.distance).toBe(expectedDistance);
  }
}

function plantedCycle(size: number): number[][] {
  const permutation = Array.from({ length: size }, (_, index) => index);
  const random = seededRandom(492);

  for (let index = permutation.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [permutation[index], permutation[swapIndex]] = [permutation[swapIndex], permutation[index]];
  }

  const matrix = Array.from({ length: size }, () => Array<number>(size).fill(0));

  for (let index = 0; index < size; index++) {
    matrix[permutation[index]][permutation[(index + 1) % size]] = 1;
  }

  return matrix;
}

function denseAsymmetricMatrix(size: number, seed: number): number[][] {
  const random = seededRandom(seed);

  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_cell, column) => (row === column ? 0 : 1 + Math.floor(random() * 99))));
}

describe('GraphAlgorithms.solveTravelingSalesmanProblemGA', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns null for tiny input', () => {
    expect(GraphAlgorithms.solveTravelingSalesmanProblemGA([])).toBeNull();
    expect(GraphAlgorithms.solveTravelingSalesmanProblemGA([[0]])).toBeNull();
  });

  it('returns the closed two-city cycle', () => {
    const matrix = [
      [0, 7],
      [11, 0],
    ];

    const result = GraphAlgorithms.solveTravelingSalesmanProblemGA(matrix);

    expect(result).not.toBeNull();

    if (result) {
      assertHamiltonianCycle(matrix, result, 18);
    }
  });

  it('retains the best individual found before later generations', () => {
    const matrix = [
      [0, 28, 54, 66, 45, 37],
      [89, 0, 31, 9, 40, 45],
      [8, 59, 0, 26, 98, 30],
      [6, 33, 87, 0, 84, 10],
      [2, 96, 77, 57, 0, 99],
      [34, 12, 86, 6, 10, 0],
    ];
    const random = seededRandom(1);
    let calls = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (calls++ < 600 ? random() : 0.9999));

    const result = GraphAlgorithms.solveTravelingSalesmanProblemGA(matrix);

    expect(result).not.toBeNull();

    if (result) {
      assertHamiltonianCycle(matrix, result);
      expect(result.distance).toBeLessThanOrEqual(107);
    }
  });

  it('continues past a short plateau to find a later improvement', () => {
    const matrix = denseAsymmetricMatrix(8, 1_971);
    vi.spyOn(Math, 'random').mockImplementation(boundedRandom(5_319, 1_000_000));

    const result = GraphAlgorithms.solveTravelingSalesmanProblemGA(matrix);

    expect(result).not.toBeNull();

    if (result) {
      assertHamiltonianCycle(matrix, result);
      expect(result.distance).toBeLessThan(171);
    }
  });

  it.each([8, 10])('finds the planted sparse directed %i-city cycle without exhausting RNG', (size) => {
    const matrix = plantedCycle(size);
    vi.spyOn(Math, 'random').mockImplementation(boundedRandom(17, 1_000_000));

    const result = GraphAlgorithms.solveTravelingSalesmanProblemGA(matrix);

    expect(result).not.toBeNull();

    if (result) {
      assertHamiltonianCycle(matrix, result, size);
    }
  });

  it('returns valid cycles for deterministic dense asymmetric graphs without mutating input', () => {
    for (let size = 3; size <= 8; size++) {
      const matrix = denseAsymmetricMatrix(size, size * 73);
      const before = matrix.map((row) => [...row]);
      vi.spyOn(Math, 'random').mockImplementation(seededRandom(size * 197));

      const result = GraphAlgorithms.solveTravelingSalesmanProblemGA(matrix);

      expect(result, `${size} cities`).not.toBeNull();

      if (result) {
        assertHamiltonianCycle(matrix, result);
      }

      expect(matrix).toEqual(before);
      vi.restoreAllMocks();
    }
  });

  it('returns null for graphs without a Hamiltonian cycle under a bounded RNG', () => {
    const noOutgoingEdges = [
      [0, 4, 0],
      [4, 0, 0],
      [0, 0, 0],
    ];
    const disjointDirectedCycles = [
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0, 0],
    ];

    for (const matrix of [noOutgoingEdges, disjointDirectedCycles]) {
      vi.spyOn(Math, 'random').mockImplementation(boundedRandom(17, 1_000_000));

      expect(GraphAlgorithms.solveTravelingSalesmanProblemGA(matrix)).toBeNull();

      vi.restoreAllMocks();
    }
  });
});
