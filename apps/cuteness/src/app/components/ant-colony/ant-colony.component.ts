import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Route } from '@angular/router';
import { GraphComponent } from '../graph/graph.component';
import { GraphHelper } from '../../tools/graph-helper';
import { MatTableModule } from '@angular/material/table';
import { GraphAlgorithms, TsmResult } from '../../tools/ant-colony/graph-algorithms';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'cuteness-ant-colony',
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
  templateUrl: './ant-colony.component.html',
  styleUrls: ['./ant-colony.component.scss'],
})
export class AntColonyComponent {
  protected adjacencyMatrix: number[][] = [];
  protected displayedColumns: string[] = [];
  protected solution?: TsmResult | null;
  protected size = 5;
  protected methods = [
    {
      title: 'Ants',
      handler: GraphAlgorithms.solveTravelingSalesmanProblem,
    },
    {
      title: 'Genetic',
      handler: GraphAlgorithms.solveTravelingSalesmanProblemGA,
    },
    {
      title: 'BranchAndBound',
      handler: GraphAlgorithms.solveTravelingSalesmanProblemBaB,
    }
  ];

  constructor() {
    this.selected = this.methods[0].handler;
  }
  protected selected: (graph: number[][]) => TsmResult | null;

  protected generateMatrix() {
    this.adjacencyMatrix = GraphHelper.generateDirectedAdjacencyMatrix(this.size, 0.5);
    this.displayedColumns = Array.from({ length: this.adjacencyMatrix.length }, (_, i) => i.toString());
    this.solution = undefined;
  }

  protected solve() {
    this.solution = this.selected(this.adjacencyMatrix);
  }
}


export default [{ path: '', component: AntColonyComponent }] as Route[];
