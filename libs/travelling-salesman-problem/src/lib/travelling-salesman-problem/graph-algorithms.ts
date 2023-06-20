import { PriorityQueue, Node, Node32, NodeLittle } from './priority-queue';

export interface TsmResult {
  vertices: number[];
  distance: number;
  paths: number;
}



export class GraphAlgorithms  {

  public static solveTravelingSalesmanProblemACO(graph: number[][]): TsmResult | null {
    const antCount = 100;
    const alpha = 1;
    const beta = 1;
    const evaporation = 0.5;
    const Q = 100;
    const maxIteration = 10000;
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
          let nextNode= -1;

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

      if (
        iter % checkFrequency === 0
        && prevBestPath.toString() === bestPath.toString()
      ) {
        if ( bestDistance < Infinity ) {
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
      paths,
    };
  }

  public static solveTravelingSalesmanProblemGA(graph: number[][]): TsmResult | null {
    const numCities = graph.length;
    const popSize = 20 * numCities;
    const generations = Math.trunc(100_000 / numCities );
    const eliteSize = Math.trunc(0.1 * popSize);
    const mutationRate = 0.05;

    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? Infinity : item))
    );

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
            j = parent1.indexOf(parent2[j]);  // Find the position of the conflicting gene in parent1
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

      const rouletteSelection = (population: number[][], fitnessFunc: (path: number[]) => number): [number[], number[]] => {
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
          const remainingIndividuals = population.filter(individual => individual !== parent1);
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
      paths
    };
  }

  public static solveTravelingSalesmanProblemBaB(graph: number[][]): TsmResult | null {
    const n = graph.length;

    // Create a deep copy of the graph
    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? Infinity : item))
    );

    const queue = new PriorityQueue<Node>();
    const initialNode = Math.trunc(Math.random() * graph.length);
    const initialState = new Node([initialNode], 0);
    queue.enqueue(initialState);

    while (!queue.isEmpty()) {
      const currentState = queue.dequeue();

      if (currentState) {
        if (currentState.vertices.length === n + 1) {

          return {
            vertices: currentState.vertices,
            distance: currentState.distance,
            paths: queue.size,
          };
        }

        if (
          currentState.vertices.length === n &&
          graphCopy[currentState.vertices[currentState.vertices.length - 1]][initialNode] < Infinity
        ) {
          const newState = new Node(
            [...currentState.vertices, initialNode],
            currentState.distance + graphCopy[currentState.vertices[currentState.vertices.length - 1]][initialNode],
          );

          queue.enqueue(newState);
        } else if (currentState.vertices.length < n) {
          for (let i = 0; i < n; i++) {
            if (
              !currentState.vertices.includes(i) &&
              graphCopy[currentState.vertices[currentState.vertices.length - 1]][i] < Infinity
            ) {
              const newState = new Node(
                [...currentState.vertices, i],
                currentState.distance + graphCopy[currentState.vertices[currentState.vertices.length - 1]][i],
              );
              queue.enqueue(newState);
            }
          }
        }
      }
    }

    return null;
  }

  public static solveTravelingSalesmanProblemBaB32(graph: number[][]): TsmResult | null {
    const n = graph.length;

    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? Infinity : item))
    );

    const queue = new PriorityQueue<Node32>();
    const initialNode = Math.trunc(Math.random() * graph.length);
    const initialState = new Node32(initialNode.toString(32), 0, 1 << initialNode);
    queue.enqueue(initialState);

    while (!queue.isEmpty()) {
      const currentState = queue.dequeue();

      if (currentState) {
        if (currentState.route.length === n + 1) {

          return {
            vertices: currentState.route.split('').map(char => parseInt(char, 32)),
            distance: currentState.distance,
            paths: queue.size,
          };
        }

        if (currentState.route.length === n) {
          const lastNode = parseInt(currentState.route.charAt(currentState.route.length - 1), 32);
          if (graphCopy[lastNode][initialNode] < Infinity) {
            const newState = new Node32(
              currentState.route + initialNode.toString(32),
              currentState.distance + graphCopy[lastNode][initialNode],
              currentState.bitmask | (1 << initialNode)
            );

            queue.enqueue(newState);
          }
        } else {
          for (let i = 0; i < n; i++) {
            const lastNode = parseInt(currentState.route.charAt(currentState.route.length - 1), 32);
            if (!(currentState.bitmask & (1 << i)) && graphCopy[lastNode][i] < Infinity) {
              const newRoute = currentState.route + i.toString(32);
              const newDistance = currentState.distance + graphCopy[lastNode][i];
              const newState = new Node32(newRoute, newDistance, currentState.bitmask | (1 << i));
              queue.enqueue(newState);
            }
          }
        }
      }
    }

    return null;
  }

  public static solveTravelingSalesmanProblemLittle(graph: number[][]): TsmResult | null {
    let indices = Array.from({ length: graph.length }, (_, i) => i);

    function rowReduction(matrix: number[][]) {
      const redux: number[] = [];

      const newMatrix = matrix.map((row) => {
        const min = Math.min(...row);
        redux.push(min);

        return row.map((val) => (val !== Infinity ? val - min : val));
      });

      return {
        redux,
        matrix: newMatrix
      };
    }

    function columnReduction(matrix: number[][]) {
      const transposed = matrix[0].map((_, i) => matrix.map((row) => row[i]));
      const reducedTransposed = rowReduction(transposed);

      const reducedMatrix = reducedTransposed.matrix[0].map((_, i) => reducedTransposed.matrix.map((row) => row[i]));

      return {
        redux: reducedTransposed.redux,
        matrix: reducedMatrix,
      };
    }

    function reduceMatrix(matrix: number[][]) {
      const rowReduced = rowReduction(matrix);
      const colReduced = columnReduction(rowReduced.matrix);

      return {
        score: [...rowReduced.redux, ...colReduced.redux].reduce((acc, cur) => acc + cur, 0),
        matrix: colReduced.matrix,
      }
    }

    function calculatePenalties(matrix: number[][]) {
      let maxPenalty = -Infinity;
      let maxPenaltyPos: [number, number] | null = null;
      const penalties: number[][] = Array(matrix.length).fill(0).map(() => Array(matrix.length).fill(0));

      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          if (matrix[i][j] === 0) {
            const rowMin = Math.min(...matrix[i].filter((val, idx) => idx !== j && val !== Infinity));
            const colMin = Math.min(...matrix.map((row, idx) => (idx !== i && row[j] !== Infinity ? row[j] : Infinity)));

            penalties[i][j] = rowMin + colMin;

            if (penalties[i][j] > maxPenalty) {
              maxPenalty = penalties[i][j];
              maxPenaltyPos = [i, j];
            }
          }
        }
      }

      return { penalties, maxPenaltyPos };
    }

    function restoreOriginalIndices(indices: number[][]): number[][] {
      const originalIndices = indices.map(([row, col]) => [row, col]);
      const removedIndices = indices.slice(); // make a copy of the array

      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          if (originalIndices[j][0] >= removedIndices[i][0]) {
            originalIndices[j][0]++;
          }
          if (originalIndices[j][1] >= removedIndices[i][1]) {
            originalIndices[j][1]++;
          }
        }
      }

      return originalIndices;
    }

    function branchAndBound(res: {score: number, matrix: number[][]}) {
      const queue = new PriorityQueue<NodeLittle>();

      const initialNode = new NodeLittle(res.matrix, [], res.score);
      queue.enqueue(initialNode);

      let best: {
        cost: number;
        path: number[];
      } = {
        cost: Infinity,
        path: [],
      };

      while (!queue.isEmpty()) {
        const node = queue.dequeue()!;

        if (node.path.length === res.matrix.length - 1) {
          console.log(node);
          if (node.distance < best.cost) {
            console.log(node);
            console.log(restoreOriginalIndices(node.path));
            break;
            // best = {
            //   cost: node.distance,
            //   path: node.path,
            // };
          }
          break;
        } else {
          const { penalties, maxPenaltyPos } = calculatePenalties(node.graph);
          // console.log(penalties, maxPenaltyPos);
          if (!maxPenaltyPos) {
            continue;
          }
          const [row, col] = maxPenaltyPos;


          const exclude = [...node.graph.map(row => [...row])];
          exclude[col][row] = Infinity;
          const include = exclude.filter((_, idx) => idx !== row).map((r) => r.filter((_, idx) => idx !== col));

          const data = reduceMatrix(include);
          const newPath: [number, number][] = [...node.path, [row, col]];

          const includeNode = new NodeLittle(data.matrix, newPath, node.distance + data.score);

          if (penalties[row][col] !== Infinity) {
            const excludeNode = new NodeLittle(node.graph, node.path, node.distance + penalties[row][col]);
            queue.enqueue(excludeNode);

          }

          queue.enqueue(includeNode);
        }
      }

      return best;
    }

    function getZeroCoefficients(matrix: number[][]): number[][] {
      const coefficients = matrix.map((row) => [...row]);
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          if (matrix[i][j] === 0) {
            const rowMin = Math.min(...matrix[i].filter((_, index) => index !== j));
            const colMin = Math.min(...matrix.map((row) => row[j]).filter((_, index) => index !== i));
            coefficients[i][j] = rowMin + colMin;
          } else {
            coefficients[i][j] = -1;
          }
        }
      }

      return coefficients;
    }

    function selectZero(coefficients: number[][], matrix: number[][]): [number, number] {
      let maxK = -1;
      let selectedZero: [number, number] | null = null;

      for (let row = 0; row < coefficients.length; row++) {
        for (let col = 0; col < coefficients[row].length; col++) {
          const k = coefficients[row][col];
          if (k > maxK && matrix[row][col] !== Infinity) {
            maxK = k;
            selectedZero = [row, col];
          }
        }
      }
      if (!selectedZero) {
        throw new Error('No zero selected');
      }

      return selectedZero;
    }

    function deleteRowAndColumn(matrix: number[][], row: number, col: number): number[][] {
      matrix = matrix.filter((_, i) => i !== row).map(row => row.filter((_, i) => i !== col));
      indices = indices.filter(index => index !== row && index !== col);

      return matrix;
    }

    function removeReturningPaths(matrix: number[][], start: number, end: number): number[][] {
      matrix[end][start] = Infinity;

      return matrix;
    }

    const graphCopy = graph.map((row) =>
      row.map((item) => (item === 0 ? Infinity : item))
    );

    const res = reduceMatrix(graphCopy);
    // const queue = new PriorityQueue<NodeLittle>();
    // queue.enqueue(new NodeLittle(res.matrix, [], res.score))

    // const reducedGraph = reduceMatrix(graph);

    const result = branchAndBound(res);

    console.log(result);
    // const path: number[][] = [];
    // let matrixCopy: number[][] = graphCopy;
    //
    // while (matrixCopy.length > 2) {
    //   const coefficients = getZeroCoefficients(matrixCopy);
    //   const [row, col] = selectZero(coefficients, matrixCopy);
    //   console.log(row,col)
    //   const start = indices[row];
    //   const end = indices[col];
    //
    //   path.push([start, end]);
    //   matrixCopy = deleteRowAndColumn(matrixCopy, row, col);
    //   graphCopy = removeReturningPaths(graphCopy, start, end);
    // }
    //
    // const lastTwoVertices = indices;
    // path.push(lastTwoVertices);

    // здесь вы можете посчитать общую длину пути и другую необходимую информацию

    return {
      vertices: [],
      distance: 1, // расстояние замените на реальное значение
      paths: 1, // количество путей замените на реальное значение
    };
  }

}
