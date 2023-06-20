export interface Comparable<T> {
  left: T | null;
  right: T | null;
  npl: number;

  compareTo(other: Comparable<T>): number;
}
