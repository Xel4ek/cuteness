export interface TsmResult {
  vertices: number[];
  distance: number;
}

export class GraphAlgorithms {
  public static solveTravelingSalesmanProblem(graph: number[][]): TsmResult | null {
    const antCount = 100;
    const alpha = 1;
    const beta = 5;
    const evaporation = 0.5;
    const Q = 100;
    const maxIteration = 150;
    const initialPheromone = 1 / (graph.length * graph.length);
    const invalidEdge = 0;

    const distance = (i: number, j: number): number => {
      if (graph[i][j] !== invalidEdge) {
        return graph[i][j];
      } else {
        return Number.MAX_SAFE_INTEGER;
      }
    };

    const pheromone = graph.map((row) => row.map(() => initialPheromone));
    let bestDistance = Infinity;
    let bestPath: number[] = [];

    for (let iter = 0; iter < maxIteration; iter++) {
      const ants = new Array(antCount).fill(null).map(() => ({
        path: [0],
        currentNode: 0,
        cost: 0.0,
      }));

      ants.forEach((ant) => {
        const visitedSet = new Set(ant.path);

        while (visitedSet.size < graph.length) {
          const unvisited = graph[ant.currentNode]
            .map((_, idx) => idx)
            .filter((idx) => graph[ant.currentNode][idx] !== invalidEdge && !visitedSet.has(idx));

          if (!unvisited.length) {
            // @ts-ignore
            ant.path = null; // Обозначить невозможный путь как null
            break;
          }

          const denom = unvisited.reduce(
            (acc, dest) => acc + Math.pow(pheromone[ant.currentNode][dest], alpha) * Math.pow(1 / distance(ant.currentNode, dest), beta),
            0
          );

          const probabilities = unvisited.map((dest) => ({
            dest,
            prob: (Math.pow(pheromone[ant.currentNode][dest], alpha) * Math.pow(1 / distance(ant.currentNode, dest), beta)) / denom,
          }));

          probabilities.sort((a, b) => b.prob - a.prob);
          const nextNode = probabilities[0]?.dest;
          if (nextNode !== undefined) {
            ant.path.push(nextNode);
            ant.currentNode = nextNode;
            visitedSet.add(nextNode);
            ant.cost += distance(ant.path[ant.path.length - 2], ant.currentNode);
          }
        }

        if (ant.path) {
          ant.cost += distance(ant.currentNode, 0); // Возврат в начальную точку

          // костыль
          if (ant.cost < bestDistance && ant.cost < 1_000_000) {
            // Обновление лучшего пути и расстояния
            bestDistance = ant.cost;
            bestPath = [...ant.path, 0];
          }
        }
      });

      // Фильтрация муравьев со значением пути null
      const legalAnts = ants.filter((ant) => ant.path);
      if (!legalAnts.length) {return null;} // Если все муравьи имеют невозможные пути, вернуть null

      // Обновление феромонов
      for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph.length; j++) {
          if (i === j || graph[i][j] === invalidEdge) {
            continue;
          }
          pheromone[i][j] = evaporation * pheromone[i][j] + (Q / bestDistance) * (1 - evaporation);
        }
      }
    }

    if (bestPath.length < graph.length + 1) {return null;} // Если лучший путь не включает все узлы, вернуть null

    return {
      vertices: bestPath,
      distance: bestDistance,
    };
  }

  public static solveTravelingSalesmanProblemGA(graph: number[][]): TsmResult | null {
    const numCities = graph.length;
    const popSize = 200;
    const generations = 1000;
    const eliteSize = Math.floor(0.1 * popSize);
    const mutationRate = 0.01;
    const invalidEdge = 0;

    const fitness = (path: number[]): number => {
      let fit = 0;
      for (let i = 0; i < path.length - 1; i++) {
        if (graph[path[i]][path[i + 1]] !== invalidEdge) {
          fit += 1 / graph[path[i]][path[i + 1]];
        }
      }
      if (graph[path[path.length - 1]][path[0]] !== invalidEdge) {
        fit += 1 / graph[path[path.length - 1]][path[0]];
      }

      return fit;
    };

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

    const crossOver = (parent1: number[], parent2: number[]): number[] => {
      let child: number[] = [];
      const geneA = Math.floor(Math.random() * parent1.length);
      const geneB = Math.floor(Math.random() * parent1.length);

      const startGene = Math.min(geneA, geneB);
      const endGene = Math.max(geneA, geneB);

      for (let i = startGene; i < endGene; i++) {
        child.push(parent1[i]);
      }

      child = [...child, ...parent2.filter((gene) => !child.includes(gene))];
      
      return child;
    };

    let population: number[][] = Array.from({length: popSize}, () => Array.from({length: numCities}, (_, i) => i));

    for (let generation = 0; generation < generations; generation++) {
      const nextPopulation: number[][] = [];
      let bestFitness = -Infinity;
      let bestIndividual: number[] = [];

      // Сортировка популяции по фитнесу
      population.sort((a, b) => fitness(b) - fitness(a));

      // Добавление элиты в новую популяцию
      for (let i = 0; i < eliteSize; i++) {
        nextPopulation.push(population[i]);
      }

      // Кроссовер и мутация
      for (let i = 0; i < popSize - eliteSize; i++) {
        const parent1 = population[Math.floor(Math.random() * eliteSize)];
        const parent2 = population[Math.floor(Math.random() * eliteSize)];
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

      // Проверка на наличие несоединимых городов в лучшем пути
      for (let i = 0; i < bestIndividual.length - 1; i++) {
        const cityA = bestIndividual[i];
        const cityB = bestIndividual[i + 1];
        if (graph[cityA][cityB] === invalidEdge) {
          return null;
        }
      }

      // Проверка на возвращение к исходному городу
      if (graph[bestIndividual[bestIndividual.length - 1]][bestIndividual[0]] === invalidEdge) {
        return null;
      }
    }

    const calculateTotalDistance = (path: number[]): number => {
      let total = 0;
      for (let i = 0; i < path.length - 1; i++) {
        if (graph[path[i]][path[i + 1]] !== invalidEdge) {
          total += graph[path[i]][path[i + 1]];
        }
      }
      if (graph[path[path.length - 1]][path[0]] !== invalidEdge) {
        total += graph[path[path.length - 1]][path[0]];
      }

      return total;
    };

    const bestPath = [...population[0], population[0][0]];
    const bestDistance = calculateTotalDistance(bestPath);

    return {
      vertices: bestPath,
      distance: bestDistance,
    };
  }


}

