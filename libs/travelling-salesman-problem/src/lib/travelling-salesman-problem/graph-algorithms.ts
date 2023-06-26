import { Graph } from './graph';
import { PriorityQueue } from './priority-queue';

export interface TsmResult {
  vertices: number[];
  distance: number;
  paths: number;
}

export class GraphAlgorithms {
  public static solveTravelingSalesmanProblemACO(graph: number[][]): TsmResult | null {
    const antCount = graph.length * 10;
    const alpha = 1;
    const beta = 1;
    const evaporation = 0.5;
    const Q = 100;
    const maxIteration = 10000;
    const checkFrequency = 50;
    const graphCopy = graph.map((row) => row.map((item) => (item === 0 ? Infinity : item)));

    const initialPheromone = 1 / (graph.length * graph.length);

    const totalWeight = graph.reduce((sum, row) => sum + row.reduce((rowSum, weight) => rowSum + weight, 0), 0);

    const pheromone = graph.map((row) => row.map((weight) => (initialPheromone / totalWeight) * weight));

    const distance = (i: number, j: number): number => graphCopy[i][j];
    let bestDistance = Infinity;
    let bestPath: number[] = [];
    let prevBestPath: number[] = [];
    let paths = 0;

    for (let iter = 0; iter < maxIteration; iter++) {
      const ants = Array.from({ length: antCount }, () => ({
        path: [0],
        currentNode: 0,
        cost: 0.0,
      }));

      ants.forEach((ant) => {
        paths++;
        const visitedSet = new Set(ant.path);
        while (visitedSet.size < graph.length) {
          const unvisited = graph[ant.currentNode]
            .map((_, idx) => idx)
            .filter((idx) => !visitedSet.has(idx) && distance(ant.currentNode, idx));

          const denom = unvisited.reduce(
            (acc, dest) =>
              acc +
              Math.pow(pheromone[ant.currentNode][dest], alpha) * Math.pow(1 / distance(ant.currentNode, dest), beta),
            0,
          );

          const probabilities = unvisited.map((dest) => ({
            dest,
            prob:
              (Math.pow(pheromone[ant.currentNode][dest], alpha) *
                Math.pow(1 / distance(ant.currentNode, dest), beta)) /
              denom,
          }));

          probabilities.sort((a, b) => b.prob - a.prob);

          // Добавляем случайный фактор
          const randomFactor = Math.random(); // Генерируем случайное число от 0 до 1
          let cumulativeProb = 0;
          let nextNode = -1;

          for (const probability of probabilities) {
            cumulativeProb += probability.prob;
            if (cumulativeProb >= randomFactor) {
              nextNode = probability.dest;
              break;
            }
          }

          if (nextNode !== -1) {
            ant.path.push(nextNode);
            ant.currentNode = nextNode;
            visitedSet.add(nextNode);
            ant.cost += distance(ant.path[ant.path.length - 2], ant.currentNode);
          } else {
            break;
          }
        }

        ant.cost += distance(ant.currentNode, 0);
        if (ant.cost < bestDistance && ant.path.length === graph.length) {
          bestDistance = ant.cost;
          bestPath = [...ant.path, 0];
        }
      });

      if (iter % checkFrequency === 0 && prevBestPath.toString() === bestPath.toString()) {
        if (bestDistance < Infinity) {
          return {
            vertices: bestPath,
            distance: bestDistance,
            paths,
          };
        }
      }

      const deltaPheromone = ants.map((ant) => {
        const antPath = ant.path;
        const antCost = ant.cost;
        const antDeltaPheromone = Array.from({ length: graph.length }, () => 0);
        for (let i = 0; i < antPath.length - 1; i++) {
          const fromNode = antPath[i];
          const toNode = antPath[i + 1];
          antDeltaPheromone[fromNode] += Q / antCost;
          antDeltaPheromone[toNode] += Q / antCost;
        }

        return antDeltaPheromone;
      });

      for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph.length; j++) {
          if (i !== j) {
            pheromone[i][j] = evaporation * pheromone[i][j] + deltaPheromone[i][j];
          }
        }
      }

      prevBestPath = bestPath;
    }

    if (bestPath.length !== graph.length || !isFinite(bestDistance)) {
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
    const popSize = 20 * numCities;
    const generations = Math.trunc(100_000 / numCities);
    const eliteSize = Math.trunc(0.1 * popSize);
    const mutationRate = 0.05;

    const graphCopy = graph.map((row) => row.map((item) => (item === 0 ? Infinity : item)));

    const fitness = (path: number[]): number => {
      let infinityCount = 0;
      let total = 0;
      for (let i = 0; i < path.length; i++) {
        const weight = graphCopy[path[i]][path[(i + 1) % path.length]];
        if (!isFinite(Infinity)) {
          ++infinityCount;
        }

        total += weight;
      }

      return 1 / total / (infinityCount + 1);
    };

    const mutate = (path: number[], mutationRate: number): number[] => {
      const mutatedPath = [...path];
      if (Math.random() < mutationRate) {
        let i = Math.floor(Math.random() * mutatedPath.length);
        let j = Math.floor(Math.random() * mutatedPath.length);

        while (i === j) {
          j = Math.floor(Math.random() * mutatedPath.length);
        }

        if (j < i) {
          [i, j] = [j, i];
        }

        while (i < j) {
          [mutatedPath[i], mutatedPath[j]] = [mutatedPath[j], mutatedPath[i]];
          i++;
          j--;
        }
      }

      return mutatedPath;
    };

    const crossOver = (parent1: number[], parent2: number[]): number[] => {
      const size = parent1.length;
      const child = new Array(size).fill(-1);

      // Select a segment
      const start = Math.floor(Math.random() * size);
      const end = start + Math.floor(Math.random() * (size - start));

      // Copy the segment from parent1 to child
      for (let i = start; i <= end; i++) {
        child[i] = parent1[i];
      }

      // Copy remaining elements from parent2 preserving the order
      for (let i = 0; i < size; i++) {
        // If parent2 has a gene not in the child
        if (!child.includes(parent2[i])) {
          // Place it in the same position as in parent2 into child
          let j = i;
          while (child[j] !== -1) {
            j = parent1.indexOf(parent2[j]); // Find the position of the conflicting gene in parent1
          }
          child[j] = parent2[i];
        }
      }

      return child;
    };

    let population: number[][] = Array.from({ length: popSize }, () => {
      const path = Array.from({ length: numCities }, (_, i) => i);
      for (let i = path.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [path[i], path[j]] = [path[j], path[i]];
      }

      return path;
    });

    let noImprovementCount = 0;
    let bestIndividual: number[] = [];
    let previousBestFitness = -Infinity;
    let paths = 0;
    for (let generation = 0; generation < generations; generation++) {
      let bestFitness = -Infinity;

      // Сортировка популяции по фитнесу
      population.sort((a, b) => fitness(b) - fitness(a));

      paths += population.length;

      const elite = population.slice(0, eliteSize);
      // Добавление элиты в новую популяцию
      const nextPopulation: number[][] = [...elite];

      const rouletteSelection = (
        population: number[][],
        fitnessFunc: (path: number[]) => number,
      ): [number[], number[]] => {
        const totalFitness = population.reduce((sum, individual) => sum + fitnessFunc(individual), 0);

        const randomFitness1 = Math.random() * totalFitness;
        let currentSum = 0;
        let parent1: number[] | undefined;
        let parent2: number[] | undefined;

        for (const individual of population) {
          currentSum += fitnessFunc(individual);
          if (!parent1 && currentSum >= randomFitness1) {
            parent1 = individual;
          } else if (parent1 && !parent2 && currentSum >= randomFitness1) {
            parent2 = individual;
            break;
          }
        }

        // Если parent2 все еще не установлен, выбираем его случайным образом из оставшихся индивидов
        if (!parent2) {
          const remainingIndividuals = population.filter((individual) => individual !== parent1);
          const randomIndex = Math.floor(Math.random() * remainingIndividuals.length);
          parent2 = remainingIndividuals[randomIndex];
        }

        return [parent1!, parent2!];
      };

      // Кроссовер и мутация
      for (let i = 0; i < popSize - eliteSize; i++) {
        let child = crossOver(...rouletteSelection(elite, fitness));
        child = mutate(child, mutationRate);
        nextPopulation.push(child);

        // Обновление лучшего индивида
        const childFitness = fitness(child);
        if (childFitness > bestFitness) {
          bestFitness = childFitness;
          bestIndividual = child;
        }
      }

      population = nextPopulation;

      if (bestFitness > previousBestFitness) {
        previousBestFitness = bestFitness;
        noImprovementCount = 0;
      } else {
        if (bestFitness > 0) {
          if (noImprovementCount++ >= 5) {
            break;
          }
        }
      }
    }

    const calculateTotalDistance = (path: number[]): number =>
      path.reduce((acc, cur, i) => acc + graphCopy[cur][path[(i + 1) % graphCopy.length]], 0);

    const bestDistance = calculateTotalDistance(bestIndividual);
    if (!isFinite(bestDistance)) {
      return null;
    }

    return {
      vertices: [...bestIndividual, bestIndividual[0]],
      distance: bestDistance,
      paths,
    };
  }

  public static solveTravelingSalesmanProblemLittle(graph: number[][]): TsmResult | null {
    const graphCopy = graph.map((row) => row.map((item) => (item === 0 ? Infinity : item)));

    const queue = new PriorityQueue<Graph>();

    const { matrix, lowerBound } = Graph.reduceMatrix(graphCopy);
    let paths = 0;

    queue.enqueue(new Graph(matrix, lowerBound));

    while (!queue.isEmpty()) {
      const candidate= queue.dequeue();

      if (!candidate) {
        return null;
      }

      if (candidate.isScalar) {
        if (!candidate.valid) {
          return null;
        }

        const vertices = candidate.restorePath();
        if (vertices.length === graph.length + 1) {
          return {
            vertices,
            distance: candidate.distance,
            paths,
          }
        }
      } else {

          const {
            penalty,
            maxPenaltyPos: [row, col],
          } = candidate.calculatePenalties();

          if (penalty === -1) {
            return  null;
          }

          queue.enqueue(candidate.transform(row, col));

          if (penalty !== Infinity) {
            candidate.dryReduceMatrix(row, col, penalty);

            queue.enqueue(candidate);
          }
      }
      paths++;
    }

    return null;
  }
}
