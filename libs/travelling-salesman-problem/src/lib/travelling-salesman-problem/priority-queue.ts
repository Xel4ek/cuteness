interface Comparable {
  compareTo(other: Comparable): number;
}

export class Node implements Comparable {
  public vertices: number[];
  public distance: number;
  public left: Node | null = null;
  public right: Node | null = null;
  public npl = 0; // NPL (Null Path Length) is a measure used in leftist heaps

  constructor(vertices: number[], distance: number) {
    this.vertices = vertices;
    this.distance = distance;
  }

  public compareTo(other: Node): number {
    if (this.distance !== other.distance) {
      return this.distance - other.distance;
    } else {
      return other.vertices.length - this.vertices.length;
    }
  }
}

export class PriorityQueue {
  public size = 0;
  public root: Node | null = null;

  public enqueue(node: Node): void {
    this.size++;
    this.root = this.merge(this.root, node);
  }

  public dequeue(): Node | undefined {
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

  private merge(lhs: Node | null, rhs: Node | null): Node | null {
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
