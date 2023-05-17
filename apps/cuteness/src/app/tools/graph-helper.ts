export class GraphHelper {
  public static generateAdjacencyMatrix(vertices: number, fillPercentage: number): number[][] {
    if (fillPercentage < 0 || fillPercentage > 100) {
      throw new Error('Fill percentage must be between 0 and 100.');
    }

    const matrix: number[][] = [];

    for (let i = 0; i < vertices; i++) {
      matrix[i] = [];
      for (let j = 0; j < vertices; j++) {
        matrix[i].push(0);
      }
    }

    for (let i = 0; i < vertices; i++) {
      for (let j = i + 1; j < vertices; j++) {
        if (Math.random() * 100 < fillPercentage) {
          matrix[i][j] = 1;
          matrix[j][i] = 1;
        }
      }
    }

    return matrix;
  }

  public static hasIsolatedNodes(adjacencyMatrix: number[][]): boolean {
    for (let i = 0; i < adjacencyMatrix.length; i++) {
      let inboundCount = 0;
      let outboundCount = 0;

      for (let j = 0; j < adjacencyMatrix.length; j++) {
        if (adjacencyMatrix[j][i] > 0) {
          inboundCount++;
        }

        if (adjacencyMatrix[i][j] > 0) {
          outboundCount++;
        }
      }

      if (inboundCount === 0 || outboundCount === 0) {
        return true;
      }
    }

    return false;
  }

  public static generateDirectedAdjacencyMatrix(
    vertices: number,
    fillPercentage: number,
  ): number[][] {
    if (fillPercentage < 0 || fillPercentage > 1) {
      throw new Error('Fill percentage must be between 0 and 1.');
    }

    const matrix: number[][] = [];

    for (let i = 0; i < vertices; i++) {
      matrix[i] = [];
      for (let j = 0; j < vertices; j++) {
        matrix[i].push(0); // Заполнение матрицы нулями
      }
    }

    for (let i = 0; i < vertices; i++) {
      for (let j = 0; j < vertices; j++) {
        if (i !== j && Math.random() <= fillPercentage) {
          const weight = Math.random();
          matrix[i][j] = weight; // Присваивание случайного веса ребрам
        }
      }
    }

    return matrix;
  }
}
