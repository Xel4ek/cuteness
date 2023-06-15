import { State } from './state';

export class PriorityQueue {
  private items: State[];

  constructor() {
    this.items = [];
  }

  public enqueue(state: State): void {
    this.items.push(state);
    this.items.sort((a, b) => a.lowerBound - b.lowerBound);
  }

  public dequeue(): State | undefined {
    return this.items.shift();
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }
}
