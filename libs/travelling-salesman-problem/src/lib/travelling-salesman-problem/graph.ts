import { Comparable } from './comparable';

export class Graph implements Comparable {
  private static rowReduction(matrix: number[][]) {
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

  private static columnReduction(matrix: number[][]) {
    const transposed = matrix.map((_, i) => matrix.map((row) => row[i]));
    const reducedTransposed = Graph.rowReduction(transposed);

    const reducedMatrix = reducedTransposed.matrix[0].map((_, i) => reducedTransposed.matrix.map((row) => row[i]));

    return {
      redux: reducedTransposed.redux,
      matrix: reducedMatrix,
    };
  }

  public static reduceMatrix(matrix: number[][]) {
    const rowReduced = Graph.rowReduction(matrix);
    const colReduced = Graph.columnReduction(rowReduced.matrix);

    return {
      matrix: colReduced.matrix,
      lowerBound: [...rowReduced.redux, ...colReduced.redux].reduce((acc, cur) => acc + cur, 0),
    };
  }

  public get valid() {
    return this.lowerBound !== Infinity;
  }

  public get distance() {
    return this.lowerBound;
  }

  constructor(
    private matrix: number[][],
    private lowerBound = 0,
    private readonly indexes: {
      rows: number[];
      cols: number[];
    } = {
      rows: Array.from({ length: matrix.length }).map((_, i) => i),
      cols: Array.from({ length: matrix.length }).map((_, i) => i),
    },
    private readonly path: [number, number][] = [],
  ) {}

  public isScalar() {
    return this.matrix.length === 1;
  }

  public compareTo(other: Graph): number {
    return this.lowerBound - other.lowerBound;
  }

  public restorePath() {
    const result: number[] = [];
    const path: [number, number][] = [...this.path, [this.indexes.rows[0], this.indexes.cols[0]]];

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

  public dryReduceMatrix(row: number, col: number, _penalty: number) {
    this.blockPath(row, col);

    const { matrix, lowerBound } = Graph.reduceMatrix(this.matrix);
    this.matrix = matrix;
    this.lowerBound += lowerBound;
  }

  public transform(row: number, col: number) {
    const curRow = this.indexes.rows.indexOf(row);
    const curCol = this.indexes.cols.indexOf(col);

    const updated = this.matrix.map((matrixRow) => [...matrixRow]);

    const newPath: [number, number][] = [...this.path, [row, col]];
    let head = row;
    let tail = col;

    while (true) {
      const predecessor = newPath.find(([_, destination]) => destination === head);

      if (!predecessor) {
        break;
      }

      head = predecessor[0];
    }

    while (true) {
      const successor = newPath.find(([origin]) => origin === tail);

      if (!successor) {
        break;
      }

      tail = successor[1];
    }

    if (this.matrix.length > 2) {
      const blockCol = this.indexes.cols.indexOf(head);
      const blockRow = this.indexes.rows.indexOf(tail);

      if (blockCol !== -1 && blockRow !== -1) {
        updated[blockRow][blockCol] = Infinity;
      }
    }

    const newMatrix = updated.filter((_, rowIndex) => rowIndex !== curRow).map((matrixRow) => matrixRow.filter((_, colIndex) => colIndex !== curCol));

    const { matrix, lowerBound } = Graph.reduceMatrix(newMatrix);

    return new Graph(
      matrix,
      this.lowerBound + lowerBound,
      {
        rows: this.indexes.rows.filter((_, index) => index !== curRow),
        cols: this.indexes.cols.filter((_, index) => index !== curCol),
      },
      newPath,
    );
  }

  public calculatePenalties() {
    let maxPenalty = -Infinity;
    let maxPenaltyPos: [number, number] | undefined;
    const rowAlternatives = this.matrix.map((row) => {
      let first = Infinity;
      let second = Infinity;

      for (const value of row) {
        if (value <= first) {
          second = first;
          first = value;
        } else if (value < second) {
          second = value;
        }
      }

      return { first, second };
    });
    const columnAlternatives = this.matrix[0].map((_, column) => {
      let first = Infinity;
      let second = Infinity;

      for (const row of this.matrix) {
        const value = row[column];

        if (value <= first) {
          second = first;
          first = value;
        } else if (value < second) {
          second = value;
        }
      }

      return { first, second };
    });

    for (let i = 0; i < this.matrix.length; i++) {
      for (let j = 0; j < this.matrix[i].length; j++) {
        if (this.matrix[i][j] === 0) {
          const rowMin = rowAlternatives[i].second;
          const colMin = columnAlternatives[j].second;
          const penalty = rowMin + colMin;

          if (penalty >= maxPenalty) {
            maxPenalty = penalty;
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

  private blockPath(row: number, col: number) {
    const curRow = this.indexes.rows.indexOf(row);
    const curCol = this.indexes.cols.indexOf(col);

    if (curCol !== -1 && curRow !== -1) {
      this.matrix[curRow][curCol] = Infinity;
    }
  }
}
