import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphModule } from '@swimlane/ngx-graph';
import { Edge } from '@swimlane/ngx-graph/lib/models/edge.model';
import { Node } from '@swimlane/ngx-graph/lib/models/node.model'
@Component({
  selector: 'cuteness-graph[adjacencyMatrix]',
  standalone: true,
  imports: [CommonModule, GraphModule],
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
})
export class GraphComponent {
  protected links: Edge[] = [];
  protected nodes: Node[] = [];
  protected _adjacencyMatrix: number[][] = [[]];
  @Input()
  public set adjacencyMatrix(adjacencyMatrix: number[][]) {
    this._adjacencyMatrix = adjacencyMatrix;
    this.generate();
  }

  public get adjacencyMatrix(): number[][] {
    return this._adjacencyMatrix;
  }

  private generate() {
    this.links = [];
    this.nodes = [];

    // Создание узлов
    for (let i = 0; i < this.adjacencyMatrix.length; i++) {
      this.nodes.push({
        id: `node${i}`,
        label: String.fromCharCode(65 + i) // Конвертирование индекса в символ ASCII (A, B, C, ...)
      });
    }

    // Создание связей на основе матрицы смежности
    this.adjacencyMatrix.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value === 1 &&
          !this.links.some(link => (link.source === `node${j}` && link.target === `node${i}`) || (link.target === `node${j}` && link.source === `node${i}`))) {
          this.links.push({
            id: `link${i}-${j}`,
            source: `node${i}`,
            target: `node${j}`,
            label: `${String.fromCharCode(65 + i)} - ${String.fromCharCode(65 + j)}`
          });
        }
      });
    });
  }
}
