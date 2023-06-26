export interface Comparable<T> {
  compareTo(other: Comparable<T>): number;
}
