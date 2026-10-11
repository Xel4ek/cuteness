import { describe, expect, it } from 'vitest';

import { GraphAlgorithms } from './graph-algorithms';

function exhaustiveCycleDistance(matrix: number[][]): number | null {
  if (matrix.length < 2) {
    return null;
  }

  let best = Infinity;
  const visit = (path: number[], remaining: number[]) => {
    if (remaining.length === 0) {
      const cycle = [...path, 0];
      const distance = cycle.slice(1).reduce((total, to, index) => {
        const from = cycle[index];
        const weight = matrix[from][to];

        return weight === 0 ? Infinity : total + weight;
      }, 0);

      best = Math.min(best, distance);

      return;
    }

    for (const vertex of remaining) {
      visit(
        [...path, vertex],
        remaining.filter((candidate) => candidate !== vertex),
      );
    }
  };

  visit(
    [0],
    Array.from({ length: matrix.length - 1 }, (_, index) => index + 1),
  );

  return Number.isFinite(best) ? best : null;
}

function assertHamiltonianCycle(matrix: number[][], vertices: number[], expectedDistance: number) {
  expect(vertices).toHaveLength(matrix.length + 1);
  expect(vertices[0]).toBe(vertices.at(-1));
  expect(new Set(vertices.slice(0, -1)).size).toBe(matrix.length);

  const distance = vertices.slice(1).reduce((total, to, index) => {
    const weight = matrix[vertices[index]][to];
    expect(weight).toBeGreaterThan(0);

    return total + weight;
  }, 0);
  expect(distance).toBe(expectedDistance);
}

function createRandomMatrix(size: number, random: () => number, density: number): number[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      if (row === col || random() > density) {
        return 0;
      }

      return 1 + Math.floor(random() * 100);
    }),
  );
}

function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;

    return state / 2 ** 32;
  };
}

describe('GraphAlgorithms.solveTravelingSalesmanProblemLittle', () => {
  it('returns the closed two-city cycle', () => {
    const matrix = [
      [0, 7],
      [11, 0],
    ];

    const result = GraphAlgorithms.solveTravelingSalesmanProblemLittle(matrix);

    expect(result?.distance).toBe(18);
    assertHamiltonianCycle(matrix, result?.vertices ?? [], 18);
  });

  it('returns null when no Hamiltonian cycle exists', () => {
    const matrix = [
      [0, 4, 0],
      [4, 0, 0],
      [0, 0, 0],
    ];

    expect(GraphAlgorithms.solveTravelingSalesmanProblemLittle(matrix)).toBeNull();
  });

  it('does not accept two cheap disconnected subtours as a solution', () => {
    const matrix = [
      [0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [1, 0, 0, 10, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
      [10, 0, 0, 1, 0, 0],
    ];

    const result = GraphAlgorithms.solveTravelingSalesmanProblemLittle(matrix);

    expect(result?.distance).toBe(24);
    assertHamiltonianCycle(matrix, result?.vertices ?? [], 24);
  });

  it('returns an optimal cycle when all valid edges have tied weights', () => {
    const matrix = [
      [0, 1, 1, 1],
      [1, 0, 1, 1],
      [1, 1, 0, 1],
      [1, 1, 1, 0],
    ];

    const result = GraphAlgorithms.solveTravelingSalesmanProblemLittle(matrix);

    expect(result?.distance).toBe(4);
    assertHamiltonianCycle(matrix, result?.vertices ?? [], 4);
  });

  it('returns null for an empty graph', () => {
    expect(GraphAlgorithms.solveTravelingSalesmanProblemLittle([])).toBeNull();
  });

  it('matches an independent exhaustive oracle for deterministic sparse and dense graphs', () => {
    const random = seededRandom(0xdecafbad);

    for (let caseIndex = 0; caseIndex < 250; caseIndex++) {
      const size = 3 + (caseIndex % 5);
      const density = caseIndex % 2 === 0 ? 0.35 : 0.9;
      const matrix = createRandomMatrix(size, random, density);
      const expectedDistance = exhaustiveCycleDistance(matrix);
      const result = GraphAlgorithms.solveTravelingSalesmanProblemLittle(matrix);

      expect(result?.distance ?? null, `case ${caseIndex}`).toBe(expectedDistance);

      if (result && expectedDistance !== null) {
        assertHamiltonianCycle(matrix, result.vertices, expectedDistance);
      }
    }
  });
});
