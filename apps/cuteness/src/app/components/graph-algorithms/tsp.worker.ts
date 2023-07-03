/// <reference lib="webworker" />

import { GraphAlgorithms, TsmResult } from '@cuteness/travelling-salesman-problem';
import { solve_traveling_salesman_problem_little_js } from 'grapth-aloritms';

interface WorkerInputMessage {
  method: 'Ants' | 'Genetic' | 'Little' | 'LittleWASM';
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
  LittleWASM: (graph: number[][]) => {
    try {
      const data = JSON.parse(
        solve_traveling_salesman_problem_little_js(
          JSON.stringify({ data: graph })
        )
      );

      return {
        vertices: data.path,
        distance: data.distance,
        paths: data.steps,
      }
    }
    catch  {
      return null;
    }
  }
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
