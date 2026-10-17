import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Route } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GraphHelper, TsmResult } from '@cuteness/travelling-salesman-problem';
import { animationFrameScheduler, interval, map, Observable, takeWhile } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GraphComponent } from './graph/graph.component';
import { MatrixPreviewComponent } from './matrix-preview/matrix-preview.component';

interface Method {
  title: string;
  method: 'LittleWASM' | 'Little' | 'Ants' | 'Genetic';
  counter: string;
}

interface RunResult {
  id: number;
  method: Method;
  solution: TsmResult | null;
  timeElapsed: number;
}

@Component({
  selector: 'cuteness-graph-algorithms',
  imports: [
    CommonModule,
    MatButtonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    GraphComponent,
    MatrixPreviewComponent,
  ],
  templateUrl: './graph-algorithms.component.html',
  styleUrls: ['./graph-algorithms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphAlgorithmsComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected adjacencyMatrix: number[][] = [];
  protected solution?: TsmResult | null;
  protected size = 30;
  protected chance = 0.5;
  protected readonly methods: Method[] = [
    {
      title: 'Little WASM',
      method: 'LittleWASM',
      counter: 'branches',
    },

    {
      title: 'Little TS',
      method: 'Little',
      counter: 'branches',
    },
    {
      title: 'Ants',
      method: 'Ants',
      counter: 'ant tours',
    },
    {
      title: 'Genetic',
      method: 'Genetic',
      counter: 'candidates',
    },
  ];
  protected results: RunResult[] = [];
  protected selectedRun?: RunResult;
  protected statusMessage?: string;
  protected processing = false;
  protected pendingMethod?: Method;
  protected elapsedTime$: Observable<string> = interval(213, animationFrameScheduler).pipe(
    map(() => this.formatTime(performance.now() - this.startTime)),
    takeWhile(() => this.processing),
  );

  private worker: Worker = this.createWorker();
  private nextRunId = 1;
  private startTime = 0;

  public ngOnInit(): void {
    this.generateMatrix();
  }

  public ngOnDestroy(): void {
    this.worker.terminate();
  }

  protected generateMatrix(): void {
    if (this.processing) {
      return;
    }

    this.adjacencyMatrix = GraphHelper.generateDirectedAdjacencyMatrix(this.size, this.chance);
    this.solution = undefined;
    this.results = [];
    this.selectedRun = undefined;
    this.statusMessage = undefined;
  }

  protected solve(method: Method): void {
    if (this.processing || !this.adjacencyMatrix.length) {
      return;
    }

    this.processing = true;
    this.pendingMethod = method;
    this.statusMessage = undefined;
    this.startTime = performance.now();
    this.worker.postMessage({ adjacencyMatrix: this.adjacencyMatrix, method: method.method });
  }

  protected selectRun(run: RunResult): void {
    this.selectedRun = run;
    this.solution = run.solution;
    this.statusMessage = undefined;
  }

  protected resultFor(method: Method): RunResult | undefined {
    return this.results.find((run) => run.method.method === method.method);
  }

  protected chooseMethod(method: Method): void {
    if (this.processing) {
      return;
    }

    const run = this.resultFor(method);
    if (run) {
      this.selectRun(run);
    } else {
      this.solve(method);
    }
  }

  protected stop(): void {
    this.worker.terminate();
    this.worker = this.createWorker();
    this.processing = false;
    this.pendingMethod = undefined;
    this.statusMessage = 'Calculation stopped.';
  }

  protected formatTime(time: number): string {
    return `${(time / 1000).toFixed(3)} s`;
  }

  private createWorker(): Worker {
    const worker = new Worker(new URL('./tsp.worker.ts', import.meta.url));
    worker.onmessage = ({ data }: MessageEvent<{ solution: TsmResult | null; timeElapsed: number }>) => {
      if (this.worker !== worker || !this.pendingMethod) {
        return;
      }

      const run: RunResult = {
        id: this.nextRunId++,
        method: this.pendingMethod,
        solution: data.solution,
        timeElapsed: data.timeElapsed,
      };
      this.results = [...this.results.filter((result) => result.method.method !== run.method.method), run];
      this.selectRun(run);
      this.processing = false;
      this.pendingMethod = undefined;
      this.changeDetectorRef.markForCheck();
    };
    worker.onerror = () => {
      if (this.worker !== worker) {
        return;
      }

      this.stop();
      this.statusMessage = 'Calculation failed. Try again.';
      this.changeDetectorRef.markForCheck();
    };

    return worker;
  }
}

export default [{ path: '', title: 'Travelling salesman', component: GraphAlgorithmsComponent }] as Route[];
