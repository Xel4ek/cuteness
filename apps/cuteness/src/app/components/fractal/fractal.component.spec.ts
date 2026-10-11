import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FractalComponent from './fractal.component';
import { MandelbrotWorkerCommand } from './worker/mandelbrot-worker-command';
import { WorkerEvent } from './worker/worker-event';

class WorkerStub {
  public postMessage = vi.fn<(message: MandelbrotWorkerCommand, transfer?: Transferable[]) => void>();
  public terminate = vi.fn();
}

describe('fractal navigation', () => {
  let fixture: ComponentFixture<FractalComponent>;
  let canvas: HTMLCanvasElement;
  let worker: WorkerStub;
  let transferDescriptor: PropertyDescriptor | undefined;

  function coordinates() {
    const message = worker.postMessage.mock.calls
      .map(([value]) => value)
      .findLast((value) => value.type === WorkerEvent.coordinates);
    if (!message || message.type !== WorkerEvent.coordinates) {
      throw new Error('Expected a coordinate update');
    }

    return message.coordinates;
  }

  function mouse(type: string, x = 0, y = 0, button = 0) {
    canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button }));
    fixture.detectChanges();
  }

  function touch(type: string, points: [number, number][]) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', {
      value: points.map(([clientX, clientY], identifier) => ({ clientX, clientY, identifier })),
    });
    canvas.dispatchEvent(event);
    fixture.detectChanges();

    return event;
  }

  beforeEach(async () => {
    worker = new WorkerStub();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          return worker;
        }
      },
    );
    // jsdom does not implement canvas rendering, transfer, or layout.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 300));
    vi.spyOn(HTMLCanvasElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
    vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(document.body, 'clientHeight', 'get').mockReturnValue(365);
    transferDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'transferControlToOffscreen');
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', {
      configurable: true,
      value: () => ({ width: 400, height: 299 }),
    });

    await TestBed.configureTestingModule({ imports: [FractalComponent] }).compileComponents();
    fixture = TestBed.createComponent(FractalComponent);
    fixture.detectChanges();
    canvas = fixture.nativeElement.querySelector('canvas[cutenessSelectArea]');
    mouse('contextmenu', 0, 0, 2);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (transferDescriptor) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', transferDescriptor);
    } else {
      Reflect.deleteProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen');
    }
  });

  it('preserves desktop rectangle zoom and right-click reset', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100);
    mouse('mousemove', 300, 150);
    mouse('mouseup', 300, 150);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(1.5);
    expect(coordinates().leftBound).toBeCloseTo(-1.25);
    mouse('contextmenu', 0, 0, 2);
    expect(coordinates()).toEqual(initial);
  });

  it('ignores a click without a selection and resets on double-click', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100);
    mouse('mouseup', 100, 100);
    expect(coordinates()).toEqual(initial);
    mouse('mousedown', 100, 100);
    mouse('mouseup', 300, 150);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(1.5);
    mouse('dblclick', 100, 100);
    expect(coordinates()).toEqual(initial);
  });

  it('resets on a double tap while a single tap keeps the current zoom', () => {
    const initial = coordinates();
    touch('touchstart', [
      [100, 100],
      [200, 100],
    ]);
    touch('touchmove', [
      [50, 100],
      [250, 100],
    ]);
    touch('touchend', []);
    const zoomed = coordinates();
    touch('touchstart', [[150, 100]]);
    touch('touchend', []);
    expect(coordinates()).toEqual(zoomed);
    touch('touchstart', [[152, 102]]);
    touch('touchend', []);
    expect(coordinates()).toEqual(initial);
  });

  it('does not mistake separated taps or a pan for a double tap', () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    touch('touchstart', [
      [100, 100],
      [200, 100],
    ]);
    touch('touchmove', [
      [50, 100],
      [250, 100],
    ]);
    touch('touchend', []);
    touch('touchstart', [[150, 100]]);
    touch('touchend', []);
    now = 1000;
    touch('touchstart', [[150, 100]]);
    touch('touchend', []);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(1.5);
    touch('touchstart', [[150, 100]]);
    touch('touchmove', [[200, 100]]);
    const panned = coordinates();
    touch('touchend', []);
    touch('touchstart', [[200, 100]]);
    touch('touchend', []);
    expect(coordinates()).toEqual(panned);
  });

  it('pinches in and out while preserving the point between the fingers', () => {
    const initial = coordinates();
    const anchorX = initial.leftBound + (150 * 3) / 400;
    const anchorY = initial.topBound + (100 * 3) / 400;
    touch('touchstart', [
      [100, 100],
      [200, 100],
    ]);
    const move = touch('touchmove', [
      [50, 100],
      [250, 100],
    ]);
    const zoomed = coordinates();
    expect(zoomed.rightBound - zoomed.leftBound).toBeCloseTo(1.5);
    expect(zoomed.leftBound + (150 * 1.5) / 400).toBeCloseTo(anchorX);
    expect(zoomed.topBound + (100 * 1.5) / 400).toBeCloseTo(anchorY);
    expect(move.defaultPrevented).toBe(true);
    touch('touchmove', [
      [100, 100],
      [200, 100],
    ]);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(3);
    touch('touchend', []);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound);
  });

  it('pans with one finger without drawing a zoom rectangle', () => {
    const initial = coordinates();
    touch('touchstart', [[100, 100]]);
    touch('touchmove', [[120, 130]]);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound - (20 * 3) / 400);
    expect(coordinates().topBound).toBeCloseTo(initial.topBound - (30 * 3) / 400);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(3);
    const moved = coordinates();
    touch('touchend', []);
    expect(coordinates()).toEqual(moved);
  });

  it('rebases the gesture when a finger is added or lifted', () => {
    touch('touchstart', [[100, 100]]);
    touch('touchstart', [
      [100, 100],
      [200, 100],
    ]);
    touch('touchmove', [
      [50, 100],
      [250, 100],
    ]);
    const zoomed = coordinates();
    touch('touchend', [[250, 100]]);
    touch('touchmove', [[260, 100]]);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(1.5);
    expect(coordinates().leftBound).toBeCloseTo(zoomed.leftBound - (10 * 1.5) / 400);
  });

  it('ignores cancelled gestures and coincident fingers without corrupting coordinates', () => {
    const initial = coordinates();
    touch('touchstart', [
      [100, 100],
      [100, 100],
    ]);
    touch('touchmove', [
      [90, 100],
      [110, 100],
    ]);
    expect(coordinates()).toEqual(initial);
    touch('touchcancel', []);
    touch('touchmove', [
      [80, 100],
      [120, 100],
    ]);
    expect(coordinates()).toEqual(initial);
  });
});
