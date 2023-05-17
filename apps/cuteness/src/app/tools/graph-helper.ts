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

  public static  hasNoIsolatedVertices(adjacencyMatrix: number[][]): boolean {
    const vertices = adjacencyMatrix.length;

    function isConnected(a: number, b: number): boolean {
      return adjacencyMatrix[a][b] === 1 || adjacencyMatrix[b][a] === 1;
    }

    for (let i = 0; i < vertices; i++) {
      let isolated = true;

      for (let j = 0; j < vertices; j++) {
        if (i !== j && isConnected(i, j)) {
          isolated = false;
          break;
        }
      }

      if (isolated) {
        return false;
      }
    }

    return true;
  }
}
