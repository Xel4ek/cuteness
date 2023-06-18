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

  private merge(node1: Node | null, node2: Node | null): Node | null {
    if (!node1) {
      return node2;
    }
    if (!node2) {
      return node1;
    }

    if (node1.value.lowerBound > node2.value.lowerBound) {
      [node1, node2] = [node2, node1];
    }

    node1.right = this.merge(node1.right, node2);

    if (!node1.left || node1.left.npl < node1.right!.npl) {
      [node1.left, node1.right] = [node1.right, node1.left];
    }

    node1.npl = node1.right ? node1.right.npl + 1 : 1;

    return node1;
  }
}
