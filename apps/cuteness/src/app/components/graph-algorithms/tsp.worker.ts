/// <reference lib="webworker" />

import { GraphAlgorithms, TsmResult } from '@cuteness/travelling-salesman-problem';

interface WorkerInputMessage {
  method: 'Ants' | 'Genetic' | 'Little';
  adjacencyMatrix: number[][];
}

interface WorkerOutputMessage {
  solution: TsmResult;
  timeElapsed: number;
}

const algorithms = {
  Ants: GraphAlgorithms.solveTravelingSalesmanProblemACO,
  Genetic: GraphAlgorithms.solveTravelingSalesmanProblemGA,
  Little: GraphAlgorithms.solveTravelingSalesmanProblemLittle,
};

self.onmessage = ({ data }: { data: WorkerInputMessage }) => {
  const { method, adjacencyMatrix } = data;
  const algorithm = algorithms[method];
  if (algorithm) {
    const start = performance.now();
    const solution = algorithm(adjacencyMatrix);
    const end = performance.now();
    const timeElapsed = end - start;

    self.postMessage({ solution, timeElapsed } as WorkerOutputMessage);
  } else {
    console.error(`Unknown method: ${method}`);
  }
};
