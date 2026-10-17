import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  NgZone,
  OnDestroy,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { signalMethod } from '@ngrx/signals';
import ForceGraph3D, { ForceGraph3DInstance, LinkObject, NodeObject } from '3d-force-graph';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { layoutByCost } from './graph-layout';

interface City extends NodeObject {
  id: string;
}

interface Road extends LinkObject<City> {
  key: string;
  label: string;
  cost: number;
  selected: boolean;
  curvature: number;
}

@Component({
  selector: 'cuteness-graph[adjacencyMatrix]',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphComponent implements AfterViewInit, OnDestroy {
  public readonly adjacencyMatrix = input.required<number[][]>();
  public readonly solution = input<number[]>([]);

  protected readonly supported = WebGL.isWebGL2Available();

  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);
  private graph?: ForceGraph3DInstance;
  private resizeObserver?: ResizeObserver;
  private visibilityObserver?: IntersectionObserver;
  private fittingFrame?: number;
  private matrix?: number[][];
  private data: { nodes: City[]; links: Road[] } = { nodes: [], links: [] };

  private readonly update = signalMethod<{ matrix: number[][]; solution: number[] }>(({ matrix, solution }) =>
    this.zone.runOutsideAngular(() => this.updateGraph(matrix, solution)),
  );

  public ngAfterViewInit(): void {
    if (!this.supported) {
      return;
    }
    this.zone.runOutsideAngular(() => {
      const container = this.container().nativeElement;
      this.graph = new ForceGraph3D(container, {
        controlType: 'orbit',
        rendererConfig: { antialias: true },
      });
      this.graph
        .width(container.clientWidth)
        .height(container.clientHeight)
        .backgroundColor('#25252c')
        .showNavInfo(false)
        .nodeLabel((node) => `City ${node.id}`)
        .nodeColor(() => '#9b8ee0')
        .nodeOpacity(1)
        .nodeRelSize(3)
        .linkLabel('label')
        .linkOpacity(1)
        .linkCurvature('curvature')
        .linkDirectionalArrowRelPos(0.9)
        .linkDirectionalArrowResolution(4)
        .enableNodeDrag(false)
        .cooldownTicks(0);

      this.resizeObserver = new ResizeObserver(([entry]) => {
        this.graph?.width(entry.contentRect.width).height(entry.contentRect.height);
      });
      this.resizeObserver.observe(container);
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.graph?.resumeAnimation();
        } else {
          this.graph?.pauseAnimation();
        }
      });
      this.visibilityObserver.observe(container);
    });
    this.update(() => ({ matrix: this.adjacencyMatrix(), solution: this.solution() }), { injector: this.injector });
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();
    if (this.fittingFrame !== undefined) {
      cancelAnimationFrame(this.fittingFrame);
    }
    const renderer = this.graph?.renderer();
    this.graph?._destructor();
    renderer?.forceContextLoss();
  }

  public fitView(): void {
    this.graph?.zoomToFit(300, 30);
  }

  private updateGraph(matrix: number[][], solution: number[]): void {
    const graph = this.graph;
    if (!graph) {
      return;
    }
    if (this.matrix !== matrix) {
      this.matrix = matrix;
      const positions = layoutByCost(matrix);
      const nodes = positions.map(({ x, y, z }, index) => ({
        id: index.toString(),
        x: x * 120,
        y: y * 120,
        z: z * 120,
        fx: x * 120,
        fy: y * 120,
        fz: z * 120,
      }));
      const links: Road[] = [];
      for (let from = 0; from < matrix.length; from++) {
        for (let to = 0; to < matrix.length; to++) {
          const cost = matrix[from][to];
          if (cost > 0 && Number.isFinite(cost)) {
            links.push({
              source: from.toString(),
              target: to.toString(),
              cost,
              key: `${from}:${to}`,
              label: `${from} → ${to} · ${cost}`,
              curvature: matrix[to][from] > 0 ? 0.15 : 0,
              selected: false,
            });
          }
        }
      }
      this.data = { nodes, links };
      if (this.fittingFrame !== undefined) {
        cancelAnimationFrame(this.fittingFrame);
        this.fittingFrame = undefined;
      }
      graph.onEngineStop(() => {
        // The engine-stop callback precedes the library's first update of mesh positions.
        this.fittingFrame = requestAnimationFrame(() => {
          this.fittingFrame = undefined;
          graph.zoomToFit(0, 30);
        });
        graph.onEngineStop(() => undefined);
      });
      graph.graphData(this.data);
    }
    const route = new Set(solution.slice(1).map((to, index) => `${solution[index]}:${to}`));
    for (const link of this.data.links) {
      link.selected = route.has(link.key);
    }
    const selected = new Set<LinkObject>(this.data.links.filter((link) => link.selected));
    graph
      .linkColor((link) => (selected.has(link) ? '#70e0a0' : 'rgba(175,175,200,0.06)'))
      .linkWidth((link) => (selected.has(link) ? 0.8 : 0))
      .linkDirectionalArrowLength((link) => (selected.has(link) ? 8 : 1.5))
      .linkDirectionalArrowColor((link) => (selected.has(link) ? '#70e0a0' : 'rgba(175,175,200,0.12)'));
  }
}
