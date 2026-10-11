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
      throw new Error(`ACO exceeded the random-call budget of ${maxCalls}`);
    }

    return random();
  };
}

function assertHamiltonianCycle(matrix: number[][], result: TsmResult, expectedDistance?: number) {
  expect(result.vertices).toHaveLength(matrix.length + 1);
  expect(result.vertices[0]).toBe(result.vertices.at(-1));
  expect(new Set(result.vertices.slice(0, -1))).toEqual(
    new Set(Array.from({ length: matrix.length }, (_, index) => index)),
  );

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

  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 0 : 1 + Math.floor(random() * 99))),
  );
}

describe('GraphAlgorithms.solveTravelingSalesmanProblemACO', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns null for tiny input', () => {
    expect(GraphAlgorithms.solveTravelingSalesmanProblemACO([])).toBeNull();
    expect(GraphAlgorithms.solveTravelingSalesmanProblemACO([[0]])).toBeNull();
  });

  it('returns the closed two-city cycle', () => {
    const matrix = [
      [0, 7],
      [11, 0],
    ];

    const result = GraphAlgorithms.solveTravelingSalesmanProblemACO(matrix);

    expect(result).not.toBeNull();
    if (result) {
      assertHamiltonianCycle(matrix, result, 18);
    }
  });

  it('finds the unique planted sparse directed cycle without exhausting RNG', () => {
    const matrix = plantedCycle(8);
    vi.spyOn(Math, 'random').mockImplementation(boundedRandom(17, 200_000));

    const result = GraphAlgorithms.solveTravelingSalesmanProblemACO(matrix);

    expect(result).not.toBeNull();
    if (result) {
      assertHamiltonianCycle(matrix, result, 8);
    }
  });

  it('returns null for disconnected directed cycles without exhausting RNG', () => {
    const matrix = [
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
      [0, 0, 0, 1, 0, 0],
    ];
    vi.spyOn(Math, 'random').mockImplementation(boundedRandom(17, 50_000));

    expect(GraphAlgorithms.solveTravelingSalesmanProblemACO(matrix)).toBeNull();
  });

  it('returns null when a vertex has no incoming or outgoing edge', () => {
    const missingIncoming = [
      [0, 4, 0],
      [4, 0, 0],
      [7, 8, 0],
    ];
    const missingOutgoing = [
      [0, 4, 7],
      [4, 0, 8],
      [0, 0, 0],
    ];

    expect(GraphAlgorithms.solveTravelingSalesmanProblemACO(missingIncoming)).toBeNull();
    expect(GraphAlgorithms.solveTravelingSalesmanProblemACO(missingOutgoing)).toBeNull();
  });

  it('returns valid cycles for deterministic dense asymmetric graphs without mutating input', () => {
    for (let size = 3; size <= 8; size++) {
      const matrix = denseAsymmetricMatrix(size, size * 73);
      const before = matrix.map((row) => [...row]);
      vi.spyOn(Math, 'random').mockImplementation(boundedRandom(size * 197, 200_000));

      const result = GraphAlgorithms.solveTravelingSalesmanProblemACO(matrix);

      expect(result, `${size} cities`).not.toBeNull();
      if (result) {
        assertHamiltonianCycle(matrix, result);
      }
      expect(matrix).toEqual(before);
      vi.restoreAllMocks();
    }
  });

  it('never reports a partial route through dead-end branches as a solution', () => {
    const matrix = [
      [0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0],
    ];
    vi.spyOn(Math, 'random').mockImplementation(boundedRandom(441, 200_000));

    const result = GraphAlgorithms.solveTravelingSalesmanProblemACO(matrix);

    expect(result).not.toBeNull();
    if (result) {
      assertHamiltonianCycle(matrix, result, 5);
    }
  });
});
