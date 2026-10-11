import { describe, expect, it } from 'vitest';

import { Graph } from './graph';

describe('Graph', () => {
  it('keeps the final closure of a complete Hamiltonian cycle available', () => {
    const matrix = [
      [Infinity, 0, 9, 9, 9],
      [9, Infinity, 0, 9, 9],
      [9, 9, Infinity, 0, 9],
      [9, 9, 9, Infinity, 0],
      [0, 9, 9, 9, Infinity],
    ];
    const { matrix: reduced, lowerBound } = Graph.reduceMatrix(matrix);

    const finalGraph = new Graph(reduced, lowerBound).transform(0, 1).transform(1, 2).transform(2, 3).transform(3, 4);

    expect(finalGraph.restorePath()).toEqual([0, 1, 2, 3, 4, 0]);
  });
});
