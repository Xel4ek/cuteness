export interface TsmResult {
  vertices: number[];
  distance: number;
}

export class GraphAlgorithms {
  // ...

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
      const ants = new Array(antCount).fill(null).map((_, index) => ({
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
}

