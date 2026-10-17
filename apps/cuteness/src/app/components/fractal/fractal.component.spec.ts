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

  function mouse(type: string, x = 0, y = 0, button = 0, shiftKey = false) {
    canvas.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button, shiftKey }),
    );
    fixture.detectChanges();
  }

  function wheel(deltaY: number, deltaMode = 0, x = 100, y = 150) {
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      deltaY,
      deltaMode,
    });
    canvas.dispatchEvent(event);
    fixture.detectChanges();

    return event;
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

  it('selects a zoom rectangle with Shift and preserves right-click reset', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100, 0, true);
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
    mouse('mousedown', 100, 100, 0, true);
    mouse('mouseup', 300, 150);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(1.5);
    mouse('dblclick', 100, 100);
    expect(coordinates()).toEqual(initial);
  });

  it('zooms in and out with the wheel while keeping the point under the cursor fixed', () => {
    const initial = coordinates();
    const anchorX = initial.leftBound + (100 * 3) / 400;
    const anchorY = initial.topBound + (150 * 3) / 400;
    const event = wheel(-100);
    const zoomed = coordinates();
    const span = zoomed.rightBound - zoomed.leftBound;
    expect(span).toBeLessThan(3);
    expect(zoomed.leftBound + (100 * span) / 400).toBeCloseTo(anchorX, 10);
    expect(zoomed.topBound + (150 * span) / 400).toBeCloseTo(anchorY, 10);
    expect(event.defaultPrevented).toBe(true);
    wheel(100);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound, 10);
    expect(coordinates().rightBound).toBeCloseTo(initial.rightBound, 10);
    expect(coordinates().topBound).toBeCloseTo(initial.topBound, 10);
  });

  it('normalizes line and page wheel units and keeps large wheel events finite', () => {
    wheel(48);
    const pixels = coordinates();
    mouse('contextmenu', 0, 0, 2);
    wheel(3, 1);
    expect(coordinates()).toEqual(pixels);
    mouse('contextmenu', 0, 0, 2);
    wheel(300);
    const page = coordinates();
    mouse('contextmenu', 0, 0, 2);
    wheel(1, 2);
    expect(coordinates()).toEqual(page);
    wheel(1000000);
    expect(Number.isFinite(coordinates().leftBound)).toBe(true);
    expect(coordinates().rightBound).toBeGreaterThan(coordinates().leftBound);
  });

  it('limits wheel zoom-out to 0.5x while preserving the anchor and allowing zoom-in again', () => {
    const initial = coordinates();
    const anchorX = initial.leftBound + (100 * 3) / 400;
    const anchorY = initial.topBound + (150 * 3) / 400;
    wheel(10000);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(6);
    expect(coordinates().leftBound + (100 * 6) / 400).toBeCloseTo(anchorX);
    expect(coordinates().topBound + (150 * 6) / 400).toBeCloseTo(anchorY);
    const minimum = coordinates();
    wheel(10000);
    expect(coordinates()).toEqual(minimum);
    wheel(-100);
    expect(coordinates().rightBound - coordinates().leftBound).toBeLessThan(6);
  });

  it('applies the same 0.5x zoom-out limit to pinch gestures', () => {
    touch('touchstart', [
      [50, 100],
      [250, 100],
    ]);
    touch('touchmove', [
      [140, 100],
      [160, 100],
    ]);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(6);
  });

  it('pans with the mouse by default without changing zoom or selecting a rectangle', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100);
    mouse('mousemove', 120, 130);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound - (20 * 3) / 400);
    expect(coordinates().topBound).toBeCloseTo(initial.topBound - (30 * 3) / 400);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(3);
    mouse('mousemove', 140, 140);
    mouse('mouseup', 140, 140);
    const panned = coordinates();
    expect(panned.leftBound).toBeCloseTo(initial.leftBound - (40 * 3) / 400);
    expect(panned.rightBound - panned.leftBound).toBeCloseTo(3);
    mouse('mousemove', 200, 200);
    expect(coordinates()).toEqual(panned);
  });

  it('ends a mouse drag outside the canvas and cancels it when the window loses focus', () => {
    mouse('mousedown', 100, 100);
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450, clientY: 140 }));
    fixture.detectChanges();
    const panned = coordinates();
    expect(panned.leftBound).toBeCloseTo(-2 - (350 * 3) / 400);
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 450, clientY: 140 }));
    mouse('mousemove', 200, 200);
    expect(coordinates()).toEqual(panned);
    mouse('mousedown', 100, 100);
    window.dispatchEvent(new Event('blur'));
    mouse('mousemove', 200, 200);
    expect(coordinates()).toEqual(panned);
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
