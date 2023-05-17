import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Route } from '@angular/router';
import { GraphComponent } from '../graph/graph.component';
import { GraphHelper } from '../../tools/graph-helper';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'cuteness-ant-colony',
  standalone: true,
  imports: [CommonModule, MatButtonModule, GraphComponent, MatTableModule],
  templateUrl: './ant-colony.component.html',
  styleUrls: ['./ant-colony.component.scss'],
})
export class AntColonyComponent {
  protected adjacencyMatrix: number[][] = [];
  protected displayedColumns: string[] = [];
  protected hasNoIsolatedVertices = false;

  protected generateMatrix() {
    this.adjacencyMatrix = GraphHelper.generateAdjacencyMatrix(5, 80);
    this.displayedColumns = Array.from({ length: this.adjacencyMatrix.length }, (_, i) => i.toString());
    this.hasNoIsolatedVertices = GraphHelper.hasNoIsolatedVertices(this.adjacencyMatrix);
    console.log(this.hasNoIsolatedVertices);
    console.log(this.adjacencyMatrix);
  }
}


export default [{ path: '', component: AntColonyComponent }] as Route[];
