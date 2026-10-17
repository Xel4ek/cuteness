import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GraphComponent } from './graph.component';

const dependencies = vi.hoisted(() => ({ create: vi.fn(), supported: vi.fn(() => true) }));
vi.mock('3d-force-graph', () => ({
  default: class {
    constructor(...args: unknown[]) {
      return dependencies.create(...args);
    }
  },
}));
vi.mock('three/addons/capabilities/WebGL.js', () => ({ default: { isWebGL2Available: dependencies.supported } }));

interface GraphData {
  nodes: { id: string; x: number; y: number; z: number }[];
  links: { key: string; cost: number; selected: boolean }[];
}

class GraphStub {
  public data: GraphData = { nodes: [], links: [] };
  public graphData = vi.fn((data: GraphData) => {
    this.data = data;

    return this;
  });
  public width = vi.fn(() => this);
  public height = vi.fn(() => this);
  public backgroundColor = vi.fn(() => this);
  public showNavInfo = vi.fn(() => this);
  public nodeLabel = vi.fn(() => this);
  public nodeColor = vi.fn(() => this);
  public nodeOpacity = vi.fn(() => this);
  public nodeRelSize = vi.fn(() => this);
  public linkLabel = vi.fn(() => this);
  public linkOpacity = vi.fn(() => this);
  public linkCurvature = vi.fn(() => this);
  public linkDirectionalArrowRelPos = vi.fn(() => this);
  public linkDirectionalArrowResolution = vi.fn(() => this);
  public linkDirectionalArrowLength = vi.fn(() => this);
  public linkDirectionalArrowColor = vi.fn(() => this);
  public linkColor = vi.fn(() => this);
  public linkWidth = vi.fn(() => this);
  public enableNodeDrag = vi.fn(() => this);
  public cooldownTicks = vi.fn(() => this);
  public onEngineStop = vi.fn<(callback: () => void) => this>(() => this);
  public zoomToFit = vi.fn(() => this);
  public pauseAnimation = vi.fn(() => this);
  public resumeAnimation = vi.fn(() => this);
  public context = { forceContextLoss: vi.fn() };
  public renderer = vi.fn(() => this.context);
  public _destructor = vi.fn();
}

describe('3D travel-cost graph', () => {
  let fixture: ComponentFixture<GraphComponent>;
  let graph: GraphStub;
  let resize: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };
  let visibility: typeof resize;
  const matrix = [
    [0, 2, 8],
    [6, 0, 3],
    [0, 5, 0],
  ];

  beforeEach(async () => {
    dependencies.supported.mockReturnValue(true);
    graph = new GraphStub();
    dependencies.create.mockReturnValue(graph);
    resize = { observe: vi.fn(), disconnect: vi.fn() };
    visibility = { observe: vi.fn(), disconnect: vi.fn() };
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor() {
          return resize;
        }
      },
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor() {
          return visibility;
        }
      },
    );
    await TestBed.configureTestingModule({ imports: [GraphComponent] }).compileComponents();
    fixture = TestBed.createComponent(GraphComponent);
    fixture.componentRef.setInput('adjacencyMatrix', matrix);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('preserves directed costs and positions when a different route is selected', () => {
    const original = structuredClone(matrix);
    const nodes = structuredClone(graph.data.nodes);
    expect(graph.data.links.map(({ key, cost }) => ({ key, cost }))).toEqual([
      { key: '0:1', cost: 2 },
      { key: '0:2', cost: 8 },
      { key: '1:0', cost: 6 },
      { key: '1:2', cost: 3 },
      { key: '2:1', cost: 5 },
    ]);
    fixture.componentRef.setInput('solution', [0, 1, 2, 0]);
    fixture.detectChanges();
    expect(graph.data.links.filter((link) => link.selected).map((link) => link.key)).toEqual(['0:1', '1:2']);
    fixture.componentRef.setInput('solution', [0, 2, 1, 0]);
    fixture.detectChanges();
    expect(graph.data.links.filter((link) => link.selected).map((link) => link.key)).toEqual(['0:2', '1:0', '2:1']);
    expect(graph.graphData).toHaveBeenCalledOnce();
    expect(graph.data.nodes).toEqual(nodes);
    expect(matrix).toEqual(original);
    expect(graph.enableNodeDrag).toHaveBeenCalledWith(false);
    expect(graph.linkDirectionalArrowLength).toHaveBeenCalled();
  });

  it('fits the view on request and releases rendering resources on destruction', () => {
    fixture.componentInstance.fitView();
    expect(graph.zoomToFit).toHaveBeenCalledWith(300, 30);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 42),
    );
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    graph.onEngineStop.mock.calls[0][0]();
    fixture.destroy();
    expect(cancel).toHaveBeenCalledWith(42);
    expect(resize.disconnect).toHaveBeenCalledOnce();
    expect(visibility.disconnect).toHaveBeenCalledOnce();
    expect(graph._destructor).toHaveBeenCalledOnce();
    expect(graph.context.forceContextLoss).toHaveBeenCalledOnce();
  });

  it('cancels a pending fit when a new graph replaces the previous one', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn<() => number>().mockReturnValueOnce(42).mockReturnValue(43));
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    graph.onEngineStop.mock.calls[0][0]();

    fixture.componentRef.setInput('adjacencyMatrix', structuredClone(matrix));
    fixture.detectChanges();

    expect(cancel).toHaveBeenCalledWith(42);
    fixture.destroy();
    expect(cancel.mock.calls.filter(([id]) => id === 42)).toHaveLength(1);
  });

  it('shows a clear message when WebGL 2 is unavailable', () => {
    fixture.destroy();
    dependencies.create.mockClear();
    dependencies.supported.mockReturnValue(false);
    fixture = TestBed.createComponent(GraphComponent);
    fixture.componentRef.setInput('adjacencyMatrix', matrix);
    fixture.detectChanges();
    expect(dependencies.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('WebGL 2');
  });
});
