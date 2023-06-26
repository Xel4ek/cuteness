import { Comparable } from './comparable';

class Node<T extends Comparable> implements Comparable {
  public left: Node<T> | null = null;
  public right: Node<T> | null = null;
  public npl =  0;

  constructor(public readonly value:T) {}

  public compareTo(other: Node<T>): number {
    return this.value.compareTo(other.value);
  }
}

export class PriorityQueue<T extends Comparable> {
  private root: Node<T> | null = null;

  public enqueue(node: T): void {
    this.root = this.merge(this.root, new Node<T>(node));
  }

  public dequeue(): T | undefined {
    if (!this.root) {
      return undefined;
    }

    const value = this.root.value;
    this.root = this.merge(this.root.left, this.root.right);

    return value;
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
