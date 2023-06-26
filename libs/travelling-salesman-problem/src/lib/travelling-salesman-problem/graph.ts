import { Comparable } from './comparable';

export class Graph implements Comparable {
  constructor(
    public matrix: number[][],
    public lowerBound = 0,
    public readonly indexes: {
      rows: number[];
      cols: number[];
    } = {
      rows: Array.from({ length: matrix.length }).map((_, i) => i),
      cols: Array.from({ length: matrix.length }).map((_, i) => i),
    },
    public readonly path: [number, number][] = [],
  ) {}

  public compareTo(other: Graph): number {
    return this.lowerBound - other.lowerBound;
  }

  public blockPath(row: number, col: number) {
    const curRow = this.indexes.rows.indexOf(row);
    const curCol = this.indexes.cols.indexOf(col);

    if (curCol !== -1 && curRow !== -1) {
      this.matrix[curRow][curCol] = Infinity;
    }
  }

  public dryReduceMatrix(row: number, col: number, penalty: number) {
    this.blockPath(row, col);
    this.lowerBound += penalty;

    const { matrix } = this.reduceMatrix(this.matrix);
    this.matrix = matrix;
  }

  public transform(row: number, col: number) {
    const curRow = this.indexes.rows.indexOf(row);
    const curCol = this.indexes.cols.indexOf(col);

    const updated = this.matrix.map((row) => [...row]);

    const blockCol = this.indexes.cols.indexOf(row);
    const blockRow = this.indexes.rows.indexOf(col);

    if (blockCol !== -1 && blockRow !== -1) {
      updated[blockRow][blockCol] = Infinity;
    }

    const newMatrix = updated
      .filter((_, rowIndex) => rowIndex !== curRow)
      .map((row) => row.filter((_, colIndex) => colIndex !== curCol));

    const { matrix, lowerBound } = this.reduceMatrix(newMatrix);

    return new Graph(
      matrix,
      this.lowerBound + lowerBound,
      {
        rows: this.indexes.rows.filter((_, index) => index !== curRow),
        cols: this.indexes.cols.filter((_, index) => index !== curCol),
      },
      [...this.path, [row, col]],
    );
  }

  public calculatePenalties() {
    let maxPenalty = -Infinity;
    let maxPenaltyPos: [number, number] | undefined;
    const penalties: number[][] = Array(this.matrix.length)
      .fill(0)
      .map(() => Array(this.matrix.length).fill(0));

    for (let i = 0; i < this.matrix.length; i++) {
      for (let j = 0; j < this.matrix[i].length; j++) {
        if (this.matrix[i][j] === 0) {
          const rowMin = Math.min(...this.matrix[i].filter((val, idx) => idx !== j && val !== Infinity));
          const colMin = Math.min(
            ...this.matrix.map((row, idx) => (idx !== i && row[j] !== Infinity ? row[j] : Infinity)),
          );

          penalties[i][j] = rowMin + colMin;

          if (penalties[i][j] >= maxPenalty) {
            maxPenalty = penalties[i][j];
            maxPenaltyPos = [i, j];
          }
        }
      }
    }

    if (!maxPenaltyPos) {
      return { penalty: -1, maxPenaltyPos: [-1, -1] };
    }

    return {
      penalty: maxPenalty,
      maxPenaltyPos: [this.indexes.rows[maxPenaltyPos[0]], this.indexes.cols[maxPenaltyPos[1]]],
    };
  }

  public reduceMatrix(matrix: number[][]) {
    const rowReduced = this.rowReduction(matrix);
    const colReduced = this.columnReduction(rowReduced.matrix);

    return {
      matrix: colReduced.matrix,
      lowerBound: [...rowReduced.redux, ...colReduced.redux].reduce((acc, cur) => acc + cur, 0),
    };
  }

  private rowReduction(matrix: number[][]) {
    const redux: number[] = [];

    const newMatrix = matrix.map((row) => {
      const min = Math.min(...row);
      redux.push(min);

      return row.map((val) => (val !== Infinity ? val - min : val));
    });

    return {
      redux,
      matrix: newMatrix,
    };
  }

  private columnReduction(matrix: number[][]) {
    const transposed = matrix.map((_, i) => matrix.map((row) => row[i]));
    const reducedTransposed = this.rowReduction(transposed);

    const reducedMatrix = reducedTransposed.matrix[0].map((_, i) => reducedTransposed.matrix.map((row) => row[i]));

    return {
      redux: reducedTransposed.redux,
      matrix: reducedMatrix,
    };
  }

  public restorePath() {
    const result: number[] = [];
    const path = [...this.path];

    let current: [number, number] = path.shift() ?? [-1, -1];
    result.push(current[0]);
    while (path.length > 0) {
      const nextIndex = path.findIndex((pair) => pair[0] === current[1]); // ищем в массиве дугу у которой нулевой элемент равен 1 элементу предыдущей дуги
      if (nextIndex !== -1) {
        current = path[nextIndex];
        path.splice(nextIndex, 1);
        result.push(current[0]);
      } else {
        break;
      }
    }

    result.push(current[1]);

    return result;
  }
}
