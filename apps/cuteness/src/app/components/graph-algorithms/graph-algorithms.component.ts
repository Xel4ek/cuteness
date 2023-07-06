import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Route } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GraphHelper, TsmResult } from '@cuteness/travelling-salesman-problem';
import { interval, map, Observable, takeWhile } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GraphComponent } from '../graph/graph.component';
import { MatrixComponent } from '../matrix/matrix.component';

interface Method {
  title: string;
  limit: number;
  method: string;
}

@Component({
  selector: 'cuteness-graph-algorithms',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatSliderModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    GraphComponent,
    MatrixComponent,
  ],
  templateUrl: './graph-algorithms.component.html',
  styleUrls: ['./graph-algorithms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphAlgorithmsComponent implements OnDestroy {
  protected adjacencyMatrix: number[][] = [];
  protected displayedColumns: string[] = [];
  protected solution?: TsmResult | null;
  protected size = 5;
  protected lastSize = 0;
  protected chance = 0.5;
  protected methods: Method[] = [
    {
      title: 'LittleWASM',
      method: 'LittleWASM',
      limit: 60,
    },

    {
      title: 'Little',
      method: 'Little',
      limit: 60,
    },
    {
      title: 'Ants',
      method: 'Ants',
      limit: 100,
    },
    {
      title: 'Genetic',
      method: 'Genetic',
      limit: 15,
    },
  ];
  protected executionTime?: string;
  protected processing = false;
  protected elapsedTime$: Observable<string>;
  protected selected: Method;

  private worker: Worker;
  private startTime = 0;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {
    this.selected = this.methods[0];
    this.worker = new Worker(new URL('./tsp.worker.ts', import.meta.url));

    this.worker.onmessage = ({ data }) => {
      this.processing = false;
      this.solution = data.solution;
      this.executionTime = this.formatTime(data.timeElapsed);
      this.changeDetectorRef.detectChanges();
    };

    this.elapsedTime$ = interval(100).pipe(
      map(() => this.formatTime(performance.now() - this.startTime)),
      takeWhile(() => this.processing),
    );
  }

  public ngOnDestroy(): void {
    this.worker.terminate();
  }

  public resetGraph() {
    if (this.selected.limit < this.size) {
      this.size = this.selected.limit;
      this.generateMatrix();
    }
  }

  protected generateMatrix() {
    this.lastSize = this.size;
    this.adjacencyMatrix = GraphHelper.generateDirectedAdjacencyMatrix(this.size, this.chance);
    this.displayedColumns = Array.from({ length: this.adjacencyMatrix.length }, (_, i) => i.toString());
    this.solution = undefined;
  }

  protected solve() {
    this.processing = true;
    this.solution = undefined;
    this.startTime = performance.now();
    this.worker.postMessage({ adjacencyMatrix: this.adjacencyMatrix, method: this.selected.method });
  }

  private formatTime(time: number) {
    const seconds = Math.floor(time / 1000);
    const milliseconds = time % 1000;

    return `${seconds}.${Math.trunc(milliseconds)} s`;
  }
}


export default [{ path: '', component: GraphAlgorithmsComponent }] as Route[];
