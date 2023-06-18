import { State } from './state';

class Node {
  public left: Node | null = null;
  public right: Node | null = null;
  public npl = 0;

  constructor(public value: State) {}
}

export class PriorityQueue {
  private root: Node | null = null;

  public enqueue(state: State): void {
    const newNode = new Node(state);
    this.root = this.merge(this.root, newNode);
  }

  public dequeue(): State | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const rootState = this.root!.value;
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

    if (lhs.value.distance > rhs.value.distance) {
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
