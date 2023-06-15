import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Route } from '@angular/router';
import { GraphComponent } from '../graph/graph.component';
import { MatTableModule } from '@angular/material/table';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { GraphAlgorithms, GraphHelper, TsmResult } from '@cuteness/travelling-salesman-problem';

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
  ],
  templateUrl: './graph-algorithms.component.html',
  styleUrls: ['./graph-algorithms.component.scss'],
})
export class GraphAlgorithmsComponent {
  protected adjacencyMatrix: number[][] = [];
  protected displayedColumns: string[] = [];
  protected solution?: TsmResult | null;
  protected size = 5;
  protected chance = .5;
  protected methods = [

    {
      title: 'Ants',
      handler: GraphAlgorithms.solveTravelingSalesmanProblemACO,
    },
    {
      title: 'BranchAndBound',
      handler: GraphAlgorithms.solveTravelingSalesmanProblemBaB,
    },
    {
      title: 'Genetic',
      handler: GraphAlgorithms.solveTravelingSalesmanProblemGA,
    },
    // {
    //   title: 'ElasticNet',
    //   handler: GraphAlgorithms.solveTravelingSalesmanProblemElasticNet,
    // }
  ];

  constructor(
    private readonly ngZone: NgZone,
  ) {
    this.selected = this.methods[0].handler;
  }
  protected selected: (graph: number[][]) => TsmResult | null;


  protected generateMatrix() {
    this.adjacencyMatrix = GraphHelper.generateDirectedAdjacencyMatrix(this.size, this.chance);
    this.displayedColumns = Array.from({ length: this.adjacencyMatrix.length }, (_, i) => i.toString());
    this.solution = undefined;
  }

  protected solve() {
    this.ngZone.runOutsideAngular( () => {
      this.solution = this.selected(this.adjacencyMatrix);
    })
  }

  protected readonly Math = Math;
}


export default [{ path: '', component: GraphAlgorithmsComponent }] as Route[];
