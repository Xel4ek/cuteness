import { Component, Input } from '@angular/core';
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
  protected links: (Edge & { weight: number, used?: boolean })[] = [];
  protected nodes: (Node )[] = [];
  private _adjacencyMatrix: number[][] = [];
  private _solution : number[] = [];

  @Input()
  public set solution(solution: number[]) {
    if (Array.isArray(solution)) {
      this._solution = solution;
      this.processLinks();
      console.log(this.links);
    }
  }

  public get solution() {
    return this._solution;
  }

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

    // Создание массива вершин (nodes)
    for (let i = 0; i < this.adjacencyMatrix.length; i++) {
      this.nodes.push({
        id: i.toString(),
        label: `${i}`
      });
    }

    // Создание массива связей (links)
    for (let i = 0; i < this.adjacencyMatrix.length; i++) {
      for (let j = 0; j < this.adjacencyMatrix[i].length; j++) {
        if (this.adjacencyMatrix[i][j] > 0) {
          this.links.push({
            id: `link${i}-${j}`,
            source: i.toString(),
            target: j.toString(),
            label: this.adjacencyMatrix[i][j].toString(),
            weight: this.adjacencyMatrix[i][j],
          });
        }
      }
    }

  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
  }

  private processLinks() {
    for (let i = 0; i < this.solution.length - 1; i++) {
      const source = this.solution[i].toString();
      const target = this.solution[i + 1].toString();

      this.links.forEach((link) => {
        if (link.source === source && link.target === target) {
          link.used = true;
        }
      });
    }
    this.links = [...this.links]
  }
}
