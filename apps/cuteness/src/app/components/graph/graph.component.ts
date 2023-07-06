import { Component, Input } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NGX_ECHARTS_CONFIG, NgxEchartsModule } from 'ngx-echarts';
import { GraphEdgeItemOption, GraphNodeItemOption } from 'echarts/types/src/chart/graph/GraphSeries';
import { NgIf } from '@angular/common';

@Component({
  selector: 'cuteness-graph[adjacencyMatrix]',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  standalone: true,
  imports: [NgxEchartsModule, NgIf],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({ echarts: () => import('echarts') }),
    },
  ],
})
export class GraphComponent {
  protected links: GraphEdgeItemOption[] = [];
  protected mergeOptions: EChartsOption = {};
  protected nodes: GraphNodeItemOption[] = [];

  protected chartOption: EChartsOption = {
    tooltip: {},
    series: [
      {
        name: 'Les Miserables',
        type: 'graph',
        layout: 'circular',
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        data: this.nodes,
        links: this.links,
        roam: true,
        label: {
          position: 'right',
        },
        lineStyle: {
          curveness: 0.1,
        },
        emphasis: {
          focus: 'adjacency',
        },
      },
    ],
  };

  private _adjacencyMatrix: number[][] = [];
  private _solution: number[] = [];

  @Input()
  public set solution(solution: number[] | undefined) {
    if (Array.isArray(solution)) {
      this._solution = solution;
      this.processLinks();
    }
  }

  public get solution() {
    return this._solution;
  }

  @Input()
  public set adjacencyMatrix(adjacencyMatrix: number[][]) {
    this._adjacencyMatrix = adjacencyMatrix;
    this.generate();
    this.chartOption = { ...this.chartOption };
  }

  public get adjacencyMatrix(): number[][] {
    return this._adjacencyMatrix;
  }

  private generate() {
    this.links.length = 0;
    this.nodes.length = 0;

    for (let i = 0; i < this.adjacencyMatrix.length; i++) {
      this.nodes.push({
        id: i.toString(),
        name: `${i}`,
      });
    }

    for (let i = 0; i < this.adjacencyMatrix.length; i++) {
      for (let j = 0; j < this.adjacencyMatrix[i].length; j++) {
        if (this.adjacencyMatrix[i][j] > 0) {
          this.links.push({
            source: i.toString(),
            target: j.toString(),
            symbol: ['none', 'arrow'],
            label: {
              formatter: this.adjacencyMatrix[i][j].toString(),
            },
            value: this.adjacencyMatrix[i][j],
          });
        }
      }
    }
  }

  private processLinks() {

    const links: GraphEdgeItemOption[] = this.links.map((link) => ({
      ...link,
      lineStyle: {
        ...link.lineStyle,
        opacity: 0.1,
        color: 'rgb(173,173,173)',
      },
    }));

    if (this.solution) {
      for (let i = 0; i < this.solution.length - 1; i++) {
        const source = this.solution[i].toString();
        const target = this.solution[i + 1].toString();

        this.links.forEach((link) => {
          if (link.source === source && link.target === target) {
            links.push({
              ...link,
              lineStyle: {
                ...link.lineStyle,
                opacity: 1,
                color: '#179809',
              },
            });
          }
        });
      }
    }

    this.mergeOptions = {
      series: [
        {
          links,
        },
      ],
    };
  }
}
