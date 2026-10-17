import { Graph } from './graph';
import { PriorityQueue } from './priority-queue';

export interface TsmResult {
  vertices: number[];
  distance: number;
  paths: number;
}

export class GraphAlgorithms {
  public static solveTravelingSalesmanProblemACO(graph: number[][]): TsmResult | null {
    const numCities = graph.length;

    if (numCities < 2) {
      return null;
    }

    const alpha = 1;
    const beta = 1;
    const evaporation = 0.5;
    const Q = 100;
    const antCount = Math.min(10 * numCities, 100);
    const maxIterations = 300;
    const maxStagnantIterations = 30;
    const pheromoneFloor = 1e-12;

    interface Neighbor {
      city: number;
      inverseDistance: number;
    }

    const neighbors = Array.from({ length: numCities }, (): Neighbor[] => []);
    const incomingEdges = new Array<number>(numCities).fill(0);
    const pheromone = Array.from({ length: numCities }, () => new Array<number>(numCities).fill(0));

    for (let from = 0; from < numCities; from++) {
      for (let to = 0; to < numCities; to++) {
        const weight = graph[from]?.[to];

        if (from !== to && weight !== undefined && Number.isFinite(weight) && weight > 0) {
          neighbors[from].push({ city: to, inverseDistance: 1 / weight });
          incomingEdges[to]++;
          pheromone[from][to] = 1;
        }
      }
    }

    if (neighbors.some((available) => available.length === 0) || incomingEdges.some((count) => count === 0)) {
      return null;
    }

    let bestDistance = Infinity;
    let bestPath: number[] | undefined;
    let paths = 0;
    let stagnantIterations = 0;

    for (let iteration = 0; iteration < maxIterations && stagnantIterations < maxStagnantIterations; iteration++) {
      let improved = false;
      const deposits = Array.from({ length: numCities }, () => new Array<number>(numCities).fill(0));

      for (let ant = 0; ant < antCount; ant++) {
        paths++;
        const start = ant % numCities;
        const path = [start];
        const visited = new Array<boolean>(numCities).fill(false);
        visited[start] = true;
        let current = start;
        let cost = 0;
        let complete = true;

        while (path.length < numCities) {
          const available = neighbors[current];
          let totalWeight = 0;
          let fallback = -1;

          for (const neighbor of available) {
            if (!visited[neighbor.city]) {
              if (fallback === -1) {
                fallback = neighbor.city;
              }

              const transitionWeight = Math.pow(pheromone[current][neighbor.city], alpha) * Math.pow(neighbor.inverseDistance, beta);

              if (Number.isFinite(transitionWeight) && transitionWeight > 0) {
                totalWeight += transitionWeight;
              }
            }
          }

          if (fallback === -1) {
            complete = false;
            break;
          }

          let next = fallback;

          if (Number.isFinite(totalWeight) && totalWeight > 0) {
            const target = Math.random() * totalWeight;
            let cumulativeWeight = 0;

            for (const neighbor of available) {
              if (!visited[neighbor.city]) {
                const transitionWeight = Math.pow(pheromone[current][neighbor.city], alpha) * Math.pow(neighbor.inverseDistance, beta);

                if (Number.isFinite(transitionWeight) && transitionWeight > 0) {
                  cumulativeWeight += transitionWeight;

                  if (cumulativeWeight >= target) {
                    next = neighbor.city;
                    break;
                  }
                }
              }
            }
          }

          const edgeCost = graph[current][next];
          path.push(next);
          visited[next] = true;
          current = next;
          cost += edgeCost;
        }

        const closingCost = graph[current]?.[start];

        if (!complete || closingCost === undefined || !Number.isFinite(closingCost) || closingCost <= 0 || !Number.isFinite(cost + closingCost)) {
          continue;
        }

        cost += closingCost;

        if (cost < bestDistance) {
          bestDistance = cost;
          bestPath = [...path, start];
          improved = true;
        }

        const deposit = Q / cost;

        if (!Number.isFinite(deposit) || deposit <= 0) {
          continue;
        }

        for (let index = 0; index < path.length; index++) {
          const from = path[index];
          const to = path[(index + 1) % path.length];
          deposits[from][to] += deposit;
        }
      }

      for (let from = 0; from < numCities; from++) {
        for (const neighbor of neighbors[from]) {
          pheromone[from][neighbor.city] = Math.max(pheromoneFloor, evaporation * pheromone[from][neighbor.city] + deposits[from][neighbor.city]);
        }
      }

      stagnantIterations = improved ? 0 : stagnantIterations + 1;
    }

    if (!bestPath || !Number.isFinite(bestDistance)) {
      return null;
    }

    return {
      vertices: bestPath,
      distance: bestDistance,
      paths,
    };
  }

  public static solveTravelingSalesmanProblemGA(graph: number[][]): TsmResult | null {
    const numCities = graph.length;

    if (numCities < 2) {
      return null;
    }

    const isPresentEdge = (weight: number | undefined): weight is number => weight !== undefined && Number.isFinite(weight) && weight !== 0;
    const edgeWeight = (from: number, to: number): number | undefined => {
      const weight = graph[from]?.[to];

      return isPresentEdge(weight) ? weight : undefined;
    };

    for (let city = 0; city < numCities; city++) {
      const hasOutgoing = graph[city]?.some((weight, target) => target !== city && isPresentEdge(weight));
      const hasIncoming = graph.some((row, source) => source !== city && isPresentEdge(row?.[city]));

      if (!hasOutgoing || !hasIncoming) {
        return null;
      }
    }

    interface Individual {
      path: number[];
      missingEdges: number;
      cost: number;
    }

    const compareIndividuals = (left: Individual, right: Individual): number => left.missingEdges - right.missingEdges || left.cost - right.cost;

    const evaluate = (path: number[]): Individual => {
      let missingEdges = 0;
      let cost = 0;

      for (let index = 0; index < path.length; index++) {
        const weight = edgeWeight(path[index], path[(index + 1) % path.length]);

        if (weight === undefined) {
          missingEdges++;
        } else {
          cost += weight;
        }
      }

      return { path, missingEdges, cost };
    };

    const randomPath = (): number[] => {
      const path = Array.from({ length: numCities }, (_, index) => index);

      for (let index = path.length - 1; index > 0; index--) {
        const target = Math.floor(Math.random() * (index + 1));
        [path[index], path[target]] = [path[target], path[index]];
      }

      return path;
    };

    const greedyPath = (start: number): number[] => {
      const path = [start];
      const used = new Array<boolean>(numCities).fill(false);
      used[start] = true;

      while (path.length < numCities) {
        const current = path[path.length - 1];
        let next = -1;
        let nextWeight = Infinity;

        for (let city = 0; city < numCities; city++) {
          const weight = edgeWeight(current, city);

          if (!used[city] && weight !== undefined && (weight < nextWeight || (weight === nextWeight && city < next))) {
            next = city;
            nextWeight = weight;
          }
        }

        if (next === -1) {
          break;
        }

        path.push(next);
        used[next] = true;
      }

      for (let city = 0; city < numCities; city++) {
        if (!used[city]) {
          path.push(city);
        }
      }

      return path;
    };

    const mutate = (path: number[]): number[] => {
      const mutatedPath = [...path];

      if (mutatedPath.length < 2 || Math.random() >= 0.05) {
        return mutatedPath;
      }

      let first = Math.floor(Math.random() * mutatedPath.length);
      let second = Math.floor(Math.random() * (mutatedPath.length - 1));

      if (second >= first) {
        second++;
      }

      if (second < first) {
        [first, second] = [second, first];
      }

      while (first < second) {
        [mutatedPath[first], mutatedPath[second]] = [mutatedPath[second], mutatedPath[first]];
        first++;
        second--;
      }

      return mutatedPath;
    };

    const crossOver = (parent1: number[], parent2: number[]): number[] => {
      const child = new Array<number>(numCities).fill(-1);
      const included = new Array<boolean>(numCities).fill(false);
      const start = Math.floor(Math.random() * numCities);
      const end = start + Math.floor(Math.random() * (numCities - start));

      for (let index = start; index <= end; index++) {
        child[index] = parent1[index];
        included[parent1[index]] = true;
      }

      let childIndex = (end + 1) % numCities;

      for (let offset = 0; offset < numCities; offset++) {
        const parentIndex = (end + 1 + offset) % numCities;
        const city = parent2[parentIndex];

        if (!included[city]) {
          child[childIndex] = city;
          included[city] = true;
          childIndex = (childIndex + 1) % numCities;
        }
      }

      return child;
    };

    const popSize = 20 * numCities;
    const generations = Math.trunc(100_000 / numCities);
    const maxStagnantGenerations = 100;
    const eliteSize = Math.max(1, Math.trunc(0.1 * popSize));
    let paths = 0;
    let bestIndividual: Individual | undefined;

    const evaluateCandidate = (path: number[]): Individual => {
      const candidate = evaluate(path);
      paths++;

      if (!bestIndividual || compareIndividuals(candidate, bestIndividual) < 0) {
        bestIndividual = candidate;
      }

      return candidate;
    };

    let population = Array.from({ length: popSize }, () => evaluateCandidate(randomPath()));

    for (let start = 0; start < Math.min(numCities, 8); start++) {
      population.push(evaluateCandidate(greedyPath(start)));
    }

    const tournamentSelection = (candidates: Individual[]): Individual => {
      let selected = candidates[Math.floor(Math.random() * candidates.length)];

      for (let attempt = 1; attempt < 3; attempt++) {
        const contender = candidates[Math.floor(Math.random() * candidates.length)];

        if (compareIndividuals(contender, selected) < 0) {
          selected = contender;
        }
      }

      return selected;
    };

    let stagnantGenerations = 0;

    for (let generation = 0; generation < generations && stagnantGenerations < maxStagnantGenerations; generation++) {
      population.sort(compareIndividuals);
      const previousBest = bestIndividual!;
      const nextPopulation = population.slice(0, eliteSize);

      while (nextPopulation.length < popSize) {
        const child = mutate(crossOver(tournamentSelection(population).path, tournamentSelection(population).path));
        nextPopulation.push(evaluateCandidate(child));
      }

      population = nextPopulation;

      if (compareIndividuals(bestIndividual!, previousBest) < 0) {
        stagnantGenerations = 0;
      } else {
        stagnantGenerations++;
      }
    }

    if (!bestIndividual || bestIndividual.missingEdges > 0 || !Number.isFinite(bestIndividual.cost)) {
      return null;
    }

    return {
      vertices: [...bestIndividual.path, bestIndividual.path[0]],
      distance: bestIndividual.cost,
      paths,
    };
  }

  public static solveTravelingSalesmanProblemLittle(graph: number[][]): TsmResult | null {
    if (graph.length < 2) {
      return null;
    }

    let paths = 0;
    const graphCopy = graph.map((row) => row.map((item) => (item === 0 ? Infinity : item)));
    const queue = new PriorityQueue<Graph>();
    const { matrix, lowerBound } = Graph.reduceMatrix(graphCopy);

    queue.enqueue(new Graph(matrix, lowerBound));

    while (!queue.isEmpty()) {
      const candidate = queue.dequeue();

      if (!candidate || !candidate.valid) {
        continue;
      }

      if (candidate.isScalar()) {
        const vertices = candidate.restorePath();

        if (vertices.length === graph.length + 1) {
          return {
            vertices,
            distance: candidate.distance,
            paths,
          };
        }

        continue;
      }

      const {
        penalty,
        maxPenaltyPos: [row, col],
      } = candidate.calculatePenalties();

      if (penalty === -1) {
        continue;
      }

      queue.enqueue(candidate.transform(row, col));

      if (penalty !== Infinity) {
        candidate.dryReduceMatrix(row, col, penalty);

        queue.enqueue(candidate);
      }

      paths++;
    }

    return null;
  }
}
