interface Comparable<T> {
  left: T | null;
  right: T | null;
  npl: number;
  compareTo(other: Comparable<T>): number;
}

export class Node32 implements Comparable<Node32> {
  public left: Node32 | null = null;
  public right: Node32 | null = null;
  public npl = 0;


  constructor(public readonly route: string, public readonly distance: number, public readonly bitmask: number) {
  }

  public compareTo(other: Node32): number {
    if (this.distance !== other.distance) {
      return this.distance - other.distance;
    } else {
      return other.route.length - this.route.length;
    }
  }
}

export class Node implements Comparable<Node> {
  public left: Node | null = null;
  public right: Node | null = null;

  public npl = 0; // NPL (Null Path Length) is a measure used in leftist heaps

  constructor(public readonly vertices: number[], public readonly distance: number) {
  }

  public compareTo(other: Node): number {
    if (this.distance !== other.distance) {
      return this.distance - other.distance;
    } else {
      return other.vertices.length - this.vertices.length;
    }
  }
}

export class PriorityQueue<T extends Comparable<T> > {
  public size = 0;
  public root: T | null = null;

  public enqueue(node: T): void {
    this.size++;
    this.root = this.merge(this.root, node);
  }

  public dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const rootState = this.root!;
    this.root = this.merge(this.root!.left, this.root!.right);

    return rootState;
  }

  public isEmpty(): boolean {
    return this.root === null;
  }

  private merge(lhs: T | null, rhs: T | null): T | null {
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

    if (!lhs.left || lhs.left.npl < lhs.right!.npl) {
      [lhs.left, lhs.right] = [lhs.right, lhs.left];
    }

    lhs.npl = lhs.right ? lhs.right.npl + 1 : 1;

    return lhs;
  }
}
