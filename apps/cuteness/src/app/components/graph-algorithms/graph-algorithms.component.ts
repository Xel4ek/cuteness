import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Route } from '@angular/router';
import { GraphComponent } from '../graph/graph.component';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GraphHelper, TsmResult } from '@cuteness/travelling-salesman-problem';
import { interval, map, Observable, takeWhile } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const matrix = [
  [0, 0, 0, 94, 32, 0, 51, 0, 97, 0, 67, 43, 0, 0, 53, 0, 0, 0, 0, 11],
  [17, 0, 0, 0, 83, 0, 93, 58, 99, 5, 0, 96, 64, 0, 0, 0, 0, 0, 0, 75],
  [18, 33, 0, 7, 25, 0, 6, 29, 0, 71, 0, 0, 0, 18, 6, 0, 0, 24, 61, 68],
  [0, 2, 0, 0, 7, 0, 0, 94, 86, 0, 78, 21, 93, 8, 86, 0, 0, 0, 0, 0],
  [0, 0, 0, 54, 0, 0, 0, 0, 3, 0, 0, 0, 0, 58, 71, 0, 96, 72, 0, 42],
  [0, 0, 31, 85, 73, 0, 68, 83, 0, 0, 9, 89, 0, 0, 93, 0, 0, 29, 0, 0],
  [0, 0, 74, 12, 49, 33, 0, 0, 0, 0, 0, 0, 79, 13, 0, 0, 0, 79, 66, 1],
  [3, 0, 0, 4, 65, 7, 0, 0, 98, 0, 4, 0, 0, 0, 0, 0, 16, 9, 77, 98],
  [0, 0, 81, 75, 91, 4, 66, 0, 0, 94, 0, 0, 0, 0, 0, 0, 96, 0, 0, 78],
  [86, 8, 92, 0, 44, 0, 42, 0, 42, 0, 98, 79, 0, 0, 0, 5, 94, 0, 0, 36],
  [44, 29, 0, 82, 0, 0, 93, 3, 0, 0, 0, 0, 15, 0, 0, 56, 0, 0, 0, 0],
  [8, 0, 73, 94, 0, 71, 15, 15, 98, 41, 75, 0, 0, 0, 68, 41, 0, 11, 0, 56],
  [0, 0, 0, 23, 67, 9, 0, 0, 48, 0, 0, 0, 0, 7, 0, 13, 54, 0, 0, 0],
  [0, 35, 0, 0, 0, 0, 0, 0, 0, 0, 26, 84, 73, 0, 34, 0, 58, 0, 0, 36],
  [0, 0, 0, 2, 0, 0, 0, 57, 0, 0, 41, 0, 4, 0, 0, 0, 65, 0, 56, 57],
  [0, 36, 26, 64, 6, 93, 0, 6, 0, 45, 26, 67, 0, 7, 39, 0, 4, 93, 0, 49],
  [5, 81, 76, 46, 82, 0, 53, 0, 81, 36, 0, 92, 97, 0, 43, 0, 0, 0, 0, 0],
  [1, 33, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 63, 0, 0, 75, 66, 0, 53, 74],
  [69, 0, 99, 6, 0, 63, 0, 77, 0, 17, 0, 0, 0, 34, 66, 0, 93, 0, 0, 0],
  [0, 0, 24, 0, 51, 0, 37, 17, 0, 0, 81, 0, 0, 0, 0, 94, 0, 9, 0, 0]
];
const matrix2 = [
  [0, 20, 18, 12, 8,],
  [5, 0, 14, 7, 11,],
  [12, 18, 0, 6, 11],
  [11, 17, 11, 0, 12,],
  [5, 5, 5, 5, 0]
]

const matrix3 = [
  [0, 438, 165, 174, 202, 1, 539],
  [312, 0, 1, 742, 694, 630, 712],
  [325, 289, 0, 199, 1, 844, 182],
  [1, 751, 651, 0, 902, 498, 667],
  [118, 458, 832, 264, 0, 963, 674],
  [249, 897, 1, 682, 1, 0, 214],
  [1, 1, 231, 1, 165, 61, 0]
];
@Component({
  selector: 'cuteness-graph-algorithms',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    GraphComponent,
    MatTableModule,
    MatSliderModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './graph-algorithms.component.html',
  styleUrls: ['./graph-algorithms.component.scss'],
})
export class GraphAlgorithmsComponent implements OnDestroy {
  protected adjacencyMatrix: number[][] = [];
  protected displayedColumns: string[] = [];
  protected solution?: TsmResult | null;
  protected size = 5;
  protected chance = 0.5;
  protected methods = [
    {
      title: 'Little',
      method: 'Little',
    },
    {
      title: 'Ants',
      method: 'Ants',
    },
    {
      title: 'BranchAndBound',
      method: 'BranchAndBound32',
    },
    {
      title: 'Genetic',
      method: 'Genetic',
    },
  ];
  protected executionTime?: string;
  protected processing = false;
  protected elapsedTime$: Observable<string>;
  protected selected: string;


  private worker: Worker;
  private startTime = 0;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {
    this.selected = this.methods[0].method;
    this.worker = new Worker(new URL('./tsp.worker.ts', import.meta.url));

    this.worker.onmessage = ({ data }) => {
      this.processing = false;
      this.solution = data.solution;
      this.changeDetectorRef.detectChanges();
      this.executionTime = this.formatTime(data.timeElapsed);
    };

    this.elapsedTime$ = interval(100).pipe(
      map(() => this.formatTime(performance.now() - this.startTime)),
      takeWhile(() => this.processing),
    );
  }


  public ngOnDestroy(): void {
    this.worker.terminate();
  }


  protected generateMatrix() {
    this.adjacencyMatrix = GraphHelper.generateDirectedAdjacencyMatrix(this.size, this.chance);
    this.displayedColumns = Array.from({ length: this.adjacencyMatrix.length }, (_, i) => i.toString());
    this.solution = undefined;
  }

  protected solve() {
    this.processing = true;
    this.solution = undefined;
    this.startTime = performance.now();
    this.worker.postMessage({ adjacencyMatrix: this.adjacencyMatrix, method: this.selected });
  }

  protected readonly Math = Math;

  private formatTime(time: number) {
    const seconds = Math.floor(time / 1000); // Get seconds
    const milliseconds = time % 1000; // Get remaining milliseconds

    return `${seconds}.${Math.trunc(milliseconds)} s`;
  }

}


export default [{ path: '', component: GraphAlgorithmsComponent }] as Route[];
