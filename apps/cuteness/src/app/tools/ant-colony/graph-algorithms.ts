export interface TsmResult {
  vertices: number[];
  distance: number;
}

export class GraphAlgorithms {
  private static INF = 1e9; // Large constant to represent infinity

  public static solveTravelingSalesmanProblemACO(graph: number[][]): TsmResult | null {
    const antCount = 100;
    const alpha = 1;
    const beta = 1;
    const evaporation = 0.5;
    const Q = 100;
    const maxIteration = 1000;
    const checkFrequency = 50;
    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? Infinity : item))
    );

    const initialPheromone = 1 / (graph.length * graph.length);

    const totalWeight = graph.reduce((sum, row) =>
        sum + row.reduce((rowSum, weight) => rowSum + weight, 0)
      , 0);

    const pheromone = graph.map((row) =>
      row.map((weight) => initialPheromone / totalWeight * weight)
    );

    const distance = (i: number, j: number): number => graphCopy[i][j];
    let bestDistance = Infinity;
    let bestPath: number[] = [];
    let prevBestPath: number[] = [];

    for (let iter = 0; iter < maxIteration; iter++) {
      const ants = Array.from({ length: antCount }, () => ({
        path: [0],
        currentNode: 0,
        cost: 0.0,
      }));

      ants.forEach((ant) => {
        const visitedSet = new Set(ant.path);
        while (visitedSet.size < graph.length) {
          const unvisited = graph[ant.currentNode]
            .map((_, idx) => idx)
            .filter((idx) => !visitedSet.has(idx) && distance(ant.currentNode, idx));


          const denom = unvisited.reduce(
            (acc, dest) =>
              acc +
              Math.pow(pheromone[ant.currentNode][dest], alpha) *
              Math.pow(1 / distance(ant.currentNode, dest), beta),
            0
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
          let nextNode;

          for (const { dest, prob } of probabilities) {
            cumulativeProb += prob;
            if (cumulativeProb >= randomFactor) {
              nextNode = dest;
              break;
            }
          }

          if (nextNode) {
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

      if (
        iter % checkFrequency === 0
        && prevBestPath.toString() === bestPath.toString()
      ) {
        if ( bestDistance < Infinity ) {
          return {
            vertices: bestPath,
            distance: bestDistance,
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
            pheromone[i][j] =
              evaporation * pheromone[i][j] + deltaPheromone[i][j];
          }
        }
      }

      prevBestPath = bestPath;
    }

    if (
      bestPath.length !== graph.length ||
      !isFinite(bestDistance)
    ) {
      return null;
    }

    return {
      vertices: bestPath,
      distance: bestDistance,
    };
  }

  public static solveTravelingSalesmanProblemGA(graph: number[][]): TsmResult | null {
    const numCities = graph.length;
    const popSize = 200;
    const generations = 1000;
    const eliteSize = Math.trunc(0.1 * popSize);
    const mutationRate = 0.01;

    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? Infinity : item))
    );

    const fitness = (path: number[]): number =>
      path.reduce(
        (acc, cur, i) => acc + 1 / graphCopy[cur][path[(i + 1) % graphCopy.length]],
        0
      );


    const mutate = (path: number[], mutationRate: number): number[] => {
      const mutatedPath = [...path];
      for (let i = 0; i < mutatedPath.length; i++) {
        if (Math.random() < mutationRate) {
          const j = Math.floor(Math.random() * mutatedPath.length);
          [mutatedPath[i], mutatedPath[j]] = [mutatedPath[j], mutatedPath[i]];
        }
      }

      return mutatedPath;
    };

    const crossOver = (left: number[], right: number[]): number[] => {
      const prototype = left.slice(0, Math.trunc(Math.random() * left.length));

      return [...prototype, ...right.filter(gene => !prototype.includes(gene))];
    };

    let population: number[][] = Array.from({ length: popSize }, () => Array.from({ length: numCities }, (_, i) => i));
    let noImprovementCount = 0;
    let bestIndividual: number[] = [];

    for (let generation = 0; generation < generations; generation++) {
      const nextPopulation: number[][] = [];
      let bestFitness = -Infinity;
      let previousBestFitness = -Infinity;

      // Сортировка популяции по фитнесу
      population.sort((a, b) => fitness(b) - fitness(a));

      // Добавление элиты в новую популяцию
      for (let i = 0; i < eliteSize; i++) {
        nextPopulation.push(population[i]);
      }

      // Кроссовер и мутация
      for (let i = 0; i < popSize - eliteSize; i++) {
        const parent1 = population[Math.trunc(Math.random() * eliteSize)];
        const parent2 = population[Math.trunc(Math.random() * eliteSize)];
        let child = crossOver(parent1, parent2);
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
        if (noImprovementCount++ >= 5) {
          break;
        }
      }
    }

    const calculateTotalDistance = (path: number[]): number =>
      path.reduce(
        (acc, cur, i) => acc + graphCopy[cur][path[(i + 1) % graphCopy.length]],
        0
      );


    const bestDistance = calculateTotalDistance(bestIndividual);
    if (!isFinite(bestDistance)) {
      return null;
    }


    return {
      vertices: [...bestIndividual, bestIndividual[0]],
      distance: bestDistance,
    };
  }

  public static solveTravelingSalesmanProblemBaB(graph: number[][]): TsmResult | null {
    const n = graph.length;

    // Create a deep copy of the graph
    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? GraphAlgorithms.INF : item))
    );

    const queue = new PriorityQueue();
    const initialState = new State([0], 0, GraphAlgorithms.calculateLowerBound(graphCopy, [0]));
    queue.enqueue(initialState);

    let bestState: State | null = null;

    while (!queue.isEmpty()) {
      const currentState = queue.dequeue();

      if (currentState) {
        if (
          currentState.vertices.length === n &&
          graphCopy[currentState.vertices[currentState.vertices.length - 1]][0] < GraphAlgorithms.INF
        ) {
          currentState.vertices.push(0); // return to the starting point
          currentState.distance += graphCopy[currentState.vertices[currentState.vertices.length - 2]][0];

          if (!bestState || currentState.distance < bestState.distance) {
            bestState = currentState;
          }
        } else {
          for (let i = 0; i < n; i++) {
            if (
              !currentState.vertices.includes(i) &&
              graphCopy[currentState.vertices[currentState.vertices.length - 1]][i] < GraphAlgorithms.INF
            ) {
              const newState = new State(
                [...currentState.vertices, i],
                currentState.distance + graphCopy[currentState.vertices[currentState.vertices.length - 1]][i],
                0,
              );
              newState.lowerBound =
                newState.distance + GraphAlgorithms.calculateLowerBound(graphCopy, newState.vertices);
              queue.enqueue(newState);
            }
          }
        }
      }
    }

    if (!bestState || bestState.distance >= GraphAlgorithms.INF) {
      return null;
    }

    return {
      vertices: bestState.vertices,
      distance: bestState.distance,
    };
  }

  private static calculateLowerBound(graph: number[][], path: number[]): number {
    let lowerBound = 0;

    for (let i = 0; i < graph.length; i++) {
      if (!path.includes(i)) {
        let minEdge = GraphAlgorithms.INF;
        for (let j = 0; j < graph.length; j++) {
          minEdge = Math.min(minEdge, graph[i][j]);
        }
        lowerBound += minEdge;
      }
    }

    return lowerBound;
  }
}

class State {
  constructor(public vertices: number[], public distance: number, public lowerBound: number) {}
}

class PriorityQueue {
  private items: State[];

  constructor() {
    this.items = [];
  }

  public enqueue(state: State) {
    this.items.push(state);
    this.items.sort((a, b) => a.lowerBound - b.lowerBound);
  }

  public dequeue(): State | undefined {
    return this.items.shift();
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }
}
