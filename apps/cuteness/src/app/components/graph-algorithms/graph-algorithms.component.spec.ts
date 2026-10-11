import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { TsmResult } from '@cuteness/travelling-salesman-problem';

import { GraphAlgorithmsComponent } from './graph-algorithms.component';
import { GraphComponent } from './graph/graph.component';
import { MatrixComponent } from './matrix/matrix.component';

import { afterEach, beforeEach, it, expect, describe, vi } from 'vitest';

@Component({ selector: 'cuteness-graph', template: '' })
class GraphStub {
  @Input() public adjacencyMatrix: number[][] = [];
  @Input() public solution: number[] = [];
}

@Component({ selector: 'cuteness-matrix', template: '' })
class MatrixStub {
  @Input() public adjacencyMatrix: number[][] = [];
  @Input() public solution: number[] = [];
}

class WorkerStub {
  public onmessage: ((event: MessageEvent<{ solution: TsmResult | null; timeElapsed: number }>) => void) | null = null;
  public onerror: (() => void) | null = null;
  public postMessage = vi.fn();
  public terminate = vi.fn();
}

describe('GraphAlgorithmsComponent', () => {
  let component: GraphAlgorithmsComponent;
  let fixture: ComponentFixture<GraphAlgorithmsComponent>;
  let workers: WorkerStub[];

  function click(label: string) {
    const root: HTMLElement = fixture.nativeElement;
    const button = Array.from(root.querySelectorAll('button')).find(
      (item) => item.getAttribute('aria-label') === label || item.textContent?.trim() === label,
    );
    expect(button, label).toBeDefined();
    button?.click();
    fixture.detectChanges();
  }

  function complete(worker: WorkerStub, distance: number | null, timeElapsed = 1234, vertices = [0, 1, 0]) {
    worker.onmessage?.(
      new MessageEvent('message', {
        data: { solution: distance === null ? null : { vertices, distance, paths: 42 }, timeElapsed },
      }),
    );
    fixture.detectChanges();
  }

  beforeEach(async () => {
    workers = [];
    // jsdom has no Web Workers; keep the browser boundary local to this suite.
    vi.stubGlobal(
      'Worker',
      class extends WorkerStub {
        constructor() {
          super();
          workers.push(this);
        }
      },
    );

    await TestBed.configureTestingModule({
      imports: [GraphAlgorithmsComponent],
    })
      .overrideComponent(GraphAlgorithmsComponent, {
        remove: { imports: [GraphComponent, MatrixComponent] },
        add: { imports: [GraphStub, MatrixStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GraphAlgorithmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps all four results on the same graph when changing algorithms', () => {
    click('Generate');
    const worker = workers[0];

    for (const label of ['Little WASM', 'Little TS', 'Ants', 'Genetic']) {
      click(label);
      complete(worker, 100 + worker.postMessage.mock.calls.length);
    }

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.algorithm-metrics')).toHaveLength(4);
    expect(worker.postMessage.mock.calls.map(([message]) => message.method)).toEqual([
      'LittleWASM',
      'Little',
      'Ants',
      'Genetic',
    ]);
    const matrices = worker.postMessage.mock.calls.map(([message]) => message.adjacencyMatrix);
    expect(matrices.every((matrix) => matrix === matrices[0])).toBe(true);
    expect(root.querySelector<HTMLInputElement>('input[type=range]')?.max).toBe('100');
    expect(root.querySelector<HTMLInputElement>('input[type=range]')?.value).toBe('12');
  });

  it('selects a saved route without recalculating and retains unsuccessful attempts', () => {
    click('Generate');
    click('Ants');
    complete(workers[0], 100, 1007, [0, 2, 1, 0]);
    click('Genetic');
    complete(workers[0], null);

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('[aria-label="Genetic"]')?.textContent).toContain('Not found');
    click('Ants');

    expect(root.querySelector('.route')?.textContent).toContain('0 ➢ 2 ➢ 1 ➢ 0');
    expect(root.querySelector('[aria-label="Ants"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[aria-label="Ants"]')?.textContent).toContain('1.007 s');
    expect(workers[0].postMessage).toHaveBeenCalledTimes(2);
  });

  it('replaces the selected algorithm result when running it again', () => {
    click('Generate');
    click('Ants');
    complete(workers[0], 100);
    click('Genetic');
    complete(workers[0], 200);
    click('Ants');
    click('Run again');
    complete(workers[0], 90, 800, [0, 2, 1, 0]);

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.algorithm-metrics')).toHaveLength(2);
    expect(root.querySelector('[aria-label="Ants"]')?.textContent).toContain('90');
    expect(root.querySelector('[aria-label="Ants"]')?.textContent).not.toContain('100');
    expect(root.querySelector('[aria-label="Genetic"]')?.textContent).toContain('200');
    expect(root.querySelector('.route')?.textContent).toContain('0 ➢ 2 ➢ 1 ➢ 0');
    expect(workers[0].postMessage).toHaveBeenCalledTimes(3);
  });

  it('starts a fresh comparison only when generating another graph', () => {
    click('Generate');
    click('Ants');
    complete(workers[0], 100);
    click('Generate');

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.algorithm-metrics')).toHaveLength(0);
    expect(root.querySelector('.route')).toBeNull();
  });

  it('can stop a calculation and ignores messages from the terminated worker', () => {
    click('Generate');
    click('Little TS');
    const oldWorker = workers[0];
    click('Stop');

    expect(oldWorker.terminate).toHaveBeenCalledOnce();
    expect(workers).toHaveLength(2);
    click('Genetic');
    complete(oldWorker, 999);
    complete(workers[1], 100);

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.algorithm-metrics')).toHaveLength(1);
    expect(root.querySelector('[aria-label="Genetic"]')?.textContent).toContain('100');
    expect(root.querySelector('[aria-label="Genetic"]')?.textContent).not.toContain('999');
  });
});
