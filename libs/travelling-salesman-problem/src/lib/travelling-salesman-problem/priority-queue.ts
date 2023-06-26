import { Comparable } from './comparable';

export class Node<T extends Comparable<T>> implements Comparable<Node<T>> {
  public left: Node<T> | null = null;
  public npl =  0;
  public right: Node<T> | null = null;

  constructor(public readonly value:T) {
  }
  public compareTo(other: Node<T>): number {
    return this.value.compareTo(other.value);
  }
}

export class PriorityQueue<T extends Comparable<T>> {
  public size = 0;
  public root: Node<T> | null = null;

  public enqueue(node: T): void {
    this.size++;
    this.root = this.merge(this.root, new Node<T>(node));
  }

  public dequeue(): T | undefined {
    if (!this.root) {
      return undefined;
    }
    const rootState = this.root;
    this.root = this.merge(this.root.left, this.root.right);
    rootState.left = null;
    rootState.right = null;

    return rootState.value;
  }

  public isEmpty(): boolean {
    return this.root === null;
  }

  private merge(lhs: Node<T> | null, rhs: Node<T> | null): Node<T> | null {
    if (!lhs) {
      return rhs;
    }
    if (!rhs) {
      return lhs;
    }

    if (lhs.compareTo(rhs) > 0) {
      [lhs, rhs] = [rhs, lhs];
    }

    lhs.right = this.merge(lhs.right, rhs);

    if (!lhs.left || (lhs.right && lhs.left.npl < lhs.right.npl)) {
      [lhs.left, lhs.right] = [lhs.right, lhs.left];
    }

    lhs.npl = lhs.right ? lhs.right.npl + 1 : 1;

    return lhs;
  }
}
