import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MainLayoutHeaderService } from '../../layouts/mail-layout/main-layout-header.service';
import { copyPosition, parsePosition } from './fractal-position';
import { FractalView, fixedFromDecimal, fixedToNumber } from './fractal-viewport';
import FractalComponent from './fractal.component';
import { IterationControlComponent } from './iteration-control/iteration-control.component';
import { MandelbrotWorkerCommand } from './worker/mandelbrot-worker-command';
import { MandelbrotWorkerResult } from './worker/mandelbrot-worker-result';
import { WorkerEvent } from './worker/worker-event';

class WorkerStub {
  public onmessage: ((event: MessageEvent<MandelbrotWorkerResult>) => void) | null = null;
  public autoComplete = true;
  public postMessage = vi.fn<(message: MandelbrotWorkerCommand, transfer?: Transferable[]) => void>(() => {
    if (this.autoComplete) {
      this.complete();
    }
  });
  public terminate = vi.fn();

  public complete(renderTimeMs = 0): ImageBitmap {
    const request = this.postMessage.mock.calls.at(-1)?.[0];
    const size = request?.type === WorkerEvent.Init ? request.offscreenCanvas : request;
    const image: ImageBitmap = { width: size?.width ?? 400, height: size?.height ?? 299, close: vi.fn() };
    this.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'rendered',
          referenceCount: 1,
          referencesBuilt: 1,
          renderTimeMs,
          image,
        } satisfies MandelbrotWorkerResult,
      }),
    );

    return image;
  }
}

describe('fractal navigation', () => {
  let fixture: ComponentFixture<FractalComponent>;
  let canvas: HTMLCanvasElement;
  let worker: WorkerStub;
  let initialSpan: number;
  let originalHref: string;
  let viewportWidth: number;
  let viewportHeight: number;
  let resize: () => void;

  function sharedLink(view: FractalView, maxIteration: number): string {
    return new URL(`/#/fractal?position=${encodeURIComponent(copyPosition(view, maxIteration))}`, window.location.href).href;
  }

  function rendered(renderTimeMs: number) {
    const image = worker.complete(renderTimeMs);
    fixture.detectChanges();

    return image;
  }

  function coordinates() {
    const message = worker.postMessage.mock.calls.map(([value]) => value).findLast((value) => value.type === WorkerEvent.Render || value.type === WorkerEvent.Init);

    if (!message) {
      throw new Error('Expected a coordinate update');
    }

    const view = message.coordinates;
    const span = fixedToNumber(view.span, view.precision);
    const centerRe = fixedToNumber(view.centerRe, view.precision);
    const centerIm = fixedToNumber(view.centerIm, view.precision);

    return { leftBound: centerRe - span / 2, rightBound: centerRe + span / 2, topBound: centerIm - (span * 299) / 800 };
  }

  function mouse(type: string, x = 0, y = 0, button = 0, shiftKey = false) {
    canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button, shiftKey }));
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
    viewportWidth = 400;
    viewportHeight = 299;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => viewportWidth);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => viewportHeight);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        public observe = vi.fn();
        public disconnect = vi.fn();
      },
    );
    originalHref = window.location.href;
    worker = new WorkerStub();
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
    );
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          return worker;
        }
      },
    );
    // jsdom does not implement canvas rendering or layout.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 300));
    vi.spyOn(HTMLCanvasElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);

    await TestBed.configureTestingModule({
      imports: [FractalComponent],
      providers: [provideRouter([], withHashLocation())],
    }).compileComponents();
    fixture = TestBed.createComponent(FractalComponent);
    fixture.detectChanges();
    canvas = fixture.nativeElement.querySelector('canvas[cutenessSelectArea]');
    mouse('contextmenu', 0, 0, 2);
    const initial = coordinates();
    initialSpan = initial.rightBound - initial.leftBound;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', originalHref);
  });

  it('resizes both canvases and requests the latest size after a running frame finishes', () => {
    const initial = worker.postMessage.mock.calls.at(-1)?.[0].coordinates;
    const count = worker.postMessage.mock.calls.length;
    worker.autoComplete = false;
    viewportWidth = 640;
    viewportHeight = 400;
    resize();
    viewportWidth = 720;
    viewportHeight = 480;
    resize();
    expect(worker.postMessage).toHaveBeenCalledTimes(count + 1);
    worker.complete();
    expect(worker.postMessage).toHaveBeenCalledTimes(count + 2);
    expect(worker.postMessage.mock.calls.at(-1)?.[0]).toMatchObject({
      type: WorkerEvent.Render,
      width: 720,
      height: 480,
      coordinates: initial,
    });
    const root: HTMLElement = fixture.nativeElement;

    for (const element of root.querySelectorAll('canvas')) {
      expect(element.width).toBe(720);
      expect(element.height).toBe(480);
    }

    worker.complete();
    resize();
    expect(worker.postMessage).toHaveBeenCalledTimes(count + 2);
  });

  it('shows the current center and copies a full link to its coordinates, zoom and iterations', () => {
    const clipboard = TestBed.inject(Clipboard);
    const copy = vi.spyOn(clipboard, 'copy').mockReturnValue(true);
    mouse('mousedown', 100, 100);
    mouse('mousemove', 140, 120);
    mouse('mouseup', 140, 120);
    const requested = worker.postMessage.mock.calls.at(-1)?.[0].coordinates;
    expect(requested).toBeDefined();
    const button = fixture.nativeElement.querySelector('[data-testid="fractal-center"]') as HTMLButtonElement;
    expect(button.textContent).toContain('Re');
    expect(button.textContent).toContain('Im');
    button.click();
    fixture.detectChanges();
    const text = copy.mock.calls[0][0];
    expect(new URL(text).origin).toBe(window.location.origin);
    expect(new URL(text).hash).toMatch(/^#\/fractal\?position=fractal/);
    expect(new URL(text).searchParams.has('position')).toBe(false);
    expect(parsePosition(text)).toEqual({ coordinates: requested, maxIteration: 2000 });
    expect(text).not.toContain('…');
    expect(button.getAttribute('aria-label')).toBe('Fractal link copied');
    wheel(-100);
    expect(button.getAttribute('aria-label')).toBe('Copy fractal link');
  });

  it('reads the link once before the first frame and preserves subsequent user navigation', () => {
    const view = {
      centerRe: fixedFromDecimal('-0.74', 128),
      centerIm: fixedFromDecimal('0.12', 128),
      span: fixedFromDecimal('0.00003', 128),
      precision: 128,
    };
    window.history.replaceState(null, '', sharedLink(view, 3800));
    fixture.destroy();
    worker.postMessage.mockClear();
    fixture = TestBed.createComponent(FractalComponent);
    fixture.detectChanges();
    canvas = fixture.nativeElement.querySelector('canvas[cutenessSelectArea]');
    expect(worker.postMessage.mock.calls[0][0].coordinates).toEqual(view);
    expect(worker.postMessage.mock.calls[0][0].maxIteration).toBe(3800);
    expect(worker.postMessage).toHaveBeenCalledOnce();
    const link = window.location.href;
    wheel(-100);
    expect(window.location.href).toBe(link);
    const moved = worker.postMessage.mock.calls.at(-1)?.[0].coordinates;
    expect(moved).not.toEqual(view);
    window.history.replaceState(null, '', sharedLink(view, 4200));
    fixture.detectChanges();
    expect(worker.postMessage.mock.calls.at(-1)?.[0].coordinates).toEqual(moved);
    expect(worker.postMessage.mock.calls.at(-1)?.[0].maxIteration).toBe(3800);
  });

  it('pastes coordinates, zoom and iterations from a right-click on the canvas or panel', async () => {
    const clipboard = { readText: vi.fn() };
    vi.stubGlobal('navigator', { clipboard });
    const view = {
      centerRe: fixedFromDecimal('-0.74', 128),
      centerIm: fixedFromDecimal('0.12', 128),
      span: fixedFromDecimal('0.00003', 128),
      precision: 128,
    };
    clipboard.readText.mockResolvedValue(sharedLink(view, 4200));
    const control = fixture.debugElement.query(By.directive(IterationControlComponent)).injector.get(IterationControlComponent);
    control.value.set(3800);
    fixture.detectChanges();
    const before = worker.postMessage.mock.calls.length;
    const button = fixture.nativeElement.querySelector('[data-testid="fractal-center"]') as HTMLButtonElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(worker.postMessage).toHaveBeenCalledTimes(before);
    await Promise.resolve();
    fixture.detectChanges();
    expect(worker.postMessage.mock.calls.at(-1)?.[0].coordinates).toEqual(view);
    expect(worker.postMessage.mock.calls.at(-1)?.[0].maxIteration).toBe(4200);
    expect(control.value()).toBe(4200);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Position pasted');
    wheel(-100);
    mouse('contextmenu', 100, 150, 2);
    await Promise.resolve();
    fixture.detectChanges();
    expect(worker.postMessage.mock.calls.at(-1)?.[0].coordinates).toEqual(view);
  });

  it('pastes legacy coordinates without changing the current iteration setting', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { readText: vi.fn().mockResolvedValue('Re: -0.74\nIm: 0.12\nZoom: 1000\nPrecision: 128') },
    });
    const control = fixture.debugElement.query(By.directive(IterationControlComponent)).injector.get(IterationControlComponent);
    control.value.set(3800);
    fixture.detectChanges();
    mouse('contextmenu', 100, 150, 2);
    await Promise.resolve();
    fixture.detectChanges();
    expect(worker.postMessage.mock.calls.at(-1)?.[0].maxIteration).toBe(3800);
    expect(worker.postMessage.mock.calls.at(-1)?.[0].coordinates.centerRe).toBe(fixedFromDecimal('-0.74', 128));
  });

  it('restores the starting view when the clipboard is empty, invalid or inaccessible', async () => {
    const clipboard = { readText: vi.fn().mockResolvedValue('unrelated text') };
    vi.stubGlobal('navigator', { clipboard });
    const initial = worker.postMessage.mock.calls[0][0].coordinates;
    const paste = async () => {
      wheel(-100);
      expect(worker.postMessage.mock.calls.at(-1)?.[0].coordinates).not.toEqual(initial);
      mouse('contextmenu', 100, 150, 2);
      await Promise.resolve();
      fixture.detectChanges();
      expect(worker.postMessage.mock.calls.at(-1)?.[0].coordinates).toEqual(initial);
    };
    await paste();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Starting view restored');
    clipboard.readText.mockResolvedValue('');
    await paste();
    clipboard.readText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    await paste();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Allow clipboard access');
  });

  it('commits edited iterations when the canvas takes focus', () => {
    const root: HTMLElement = fixture.nativeElement;
    const input = root.querySelector<HTMLInputElement>('cuteness-iteration-control input');
    expect(input).not.toBeNull();
    input?.focus();

    if (input) {
      input.value = '3100';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    fixture.detectChanges();
    expect(worker.postMessage.mock.calls.at(-1)?.[0].maxIteration).toBe(2000);
    canvas.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(canvas);
    expect(worker.postMessage.mock.calls.at(-1)?.[0].maxIteration).toBe(3100);
  });

  it('sends iteration signals to the worker after initialization and preserves them during navigation', () => {
    const control = fixture.debugElement.query(By.directive(IterationControlComponent)).injector.get(IterationControlComponent);
    const settings = () => worker.postMessage.mock.calls.map(([message]) => message).map((message) => message.maxIteration);
    expect(worker.postMessage.mock.calls[0][0].type).toBe(WorkerEvent.Init);
    expect(settings()).toEqual([2000]);
    control.value.set(3200);
    fixture.detectChanges();
    expect(settings().at(-1)).toBe(3200);
    mouse('contextmenu', 0, 0, 2);
    expect(control.value()).toBe(3200);
    expect(settings()).toHaveLength(2);
  });

  it('shows slow frame times and removes them when the next frame is fast', () => {
    const header = TestBed.inject(MainLayoutHeaderService).getHeaderInfo();
    worker.autoComplete = false;
    wheel(-100);
    rendered(240);
    expect(header.value['render']).toBe('240 ms');
    expect(header.value['zoom']).toBeTruthy();
    wheel(-100);
    rendered(1250);
    expect(header.value['render']).toBe('1.25 s');
    wheel(-100);
    rendered(100);
    expect(header.value['render']).toBeUndefined();
  });

  it('clears the duration for a new view or settings and ignores obsolete frame results', () => {
    const header = TestBed.inject(MainLayoutHeaderService).getHeaderInfo();
    worker.autoComplete = false;
    wheel(-100);
    rendered(500);
    wheel(-200);
    expect(header.value['render']).toBeUndefined();
    wheel(-100);
    rendered(900);
    expect(header.value['render']).toBeUndefined();
    rendered(300);
    expect(header.value['render']).toBe('300 ms');
    const control = fixture.debugElement.query(By.directive(IterationControlComponent)).injector.get(IterationControlComponent);
    control.value.set(3200);
    fixture.detectChanges();
    expect(header.value['render']).toBeUndefined();
  });

  it('finishes one frame and then requests only the latest accumulated view and settings', () => {
    worker.autoComplete = false;
    wheel(-100);
    const activeCount = worker.postMessage.mock.calls.length;
    const activeView = worker.postMessage.mock.calls.at(-1)?.[0].coordinates;
    wheel(-100);
    wheel(-100);
    const control = fixture.debugElement.query(By.directive(IterationControlComponent)).injector.get(IterationControlComponent);
    control.value.set(3200);
    fixture.detectChanges();
    expect(worker.postMessage).toHaveBeenCalledTimes(activeCount);
    const image = rendered(200);
    expect(worker.postMessage).toHaveBeenCalledTimes(activeCount + 1);
    const latest = worker.postMessage.mock.calls.at(-1)?.[0];
    expect(latest?.coordinates.span).toBeLessThan(activeView?.span ?? 0n);
    expect(latest?.maxIteration).toBe(3200);
    expect(image.close).not.toHaveBeenCalled();
    rendered(150);
    expect(worker.postMessage).toHaveBeenCalledTimes(activeCount + 1);
    expect(image.close).toHaveBeenCalledOnce();
  });

  it('does not render again when pending navigation returns to the view already being calculated', () => {
    wheel(-100);
    worker.autoComplete = false;
    mouse('contextmenu');
    const count = worker.postMessage.mock.calls.length;
    wheel(-100);
    mouse('contextmenu');
    rendered(200);
    expect(worker.postMessage).toHaveBeenCalledTimes(count);
  });

  it('releases rejected and replaced bitmaps and closes the retained frame on destruction', () => {
    worker.autoComplete = false;
    wheel(-100);
    const first = rendered(200);
    const stale = rendered(300);
    expect(stale.close).toHaveBeenCalledOnce();
    wheel(-100);
    const second = rendered(200);
    expect(first.close).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(second.close).toHaveBeenCalledOnce();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('selects a zoom rectangle with Shift and preserves right-click reset', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100, 0, true);
    mouse('mousemove', 300, 150);
    mouse('mouseup', 300, 150);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan / 2, 10);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound + initialSpan / 4, 10);
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
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan / 2, 10);
    mouse('dblclick', 100, 100);
    expect(coordinates()).toEqual(initial);
  });

  it('zooms in and out with the wheel while keeping the point under the cursor fixed', () => {
    const initial = coordinates();
    const anchorX = initial.leftBound + (100 * initialSpan) / 400;
    const anchorY = initial.topBound + (150 * initialSpan) / 400;
    const event = wheel(-100);
    const zoomed = coordinates();
    const span = zoomed.rightBound - zoomed.leftBound;
    expect(span).toBeLessThan(initialSpan);
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
    const anchorX = initial.leftBound + (100 * initialSpan) / 400;
    const anchorY = initial.topBound + (150 * initialSpan) / 400;

    for (let i = 0; i < 10; i++) {
      wheel(10000);
    }

    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(6, 10);
    expect(coordinates().leftBound + (100 * 6) / 400).toBeCloseTo(anchorX, 10);
    expect(coordinates().topBound + (150 * 6) / 400).toBeCloseTo(anchorY, 10);
    const minimum = coordinates();
    wheel(10000);
    expect(coordinates()).toEqual(minimum);
    wheel(-100);
    expect(coordinates().rightBound - coordinates().leftBound).toBeLessThan(6);
  });

  it('applies the same 0.5x zoom-out limit to pinch gestures', () => {
    for (let i = 0; i < 4; i++) {
      touch('touchstart', [
        [50, 100],
        [250, 100],
      ]);
      touch('touchmove', [
        [140, 100],
        [160, 100],
      ]);
      touch('touchend', []);
    }

    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(6, 10);
  });

  it('pans with the mouse by default without changing zoom or selecting a rectangle', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100);
    mouse('mousemove', 120, 130);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound - (20 * initialSpan) / 400, 10);
    expect(coordinates().topBound).toBeCloseTo(initial.topBound - (30 * initialSpan) / 400, 10);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan, 10);
    mouse('mousemove', 140, 140);
    mouse('mouseup', 140, 140);
    const panned = coordinates();
    expect(panned.leftBound).toBeCloseTo(initial.leftBound - (40 * initialSpan) / 400, 10);
    expect(panned.rightBound - panned.leftBound).toBeCloseTo(initialSpan, 10);
    mouse('mousemove', 200, 200);
    expect(coordinates()).toEqual(panned);
  });

  it('ends a mouse drag outside the canvas and cancels it when the window loses focus', () => {
    const initial = coordinates();
    mouse('mousedown', 100, 100);
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 450, clientY: 140 }));
    fixture.detectChanges();
    const panned = coordinates();
    expect(panned.leftBound).toBeCloseTo(initial.leftBound - (350 * initialSpan) / 400, 10);
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
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan / 2, 10);
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
    const anchorX = initial.leftBound + (150 * initialSpan) / 400;
    const anchorY = initial.topBound + (100 * initialSpan) / 400;
    touch('touchstart', [
      [100, 100],
      [200, 100],
    ]);
    const move = touch('touchmove', [
      [50, 100],
      [250, 100],
    ]);
    const zoomed = coordinates();
    expect(zoomed.rightBound - zoomed.leftBound).toBeCloseTo(initialSpan / 2, 10);
    expect(zoomed.leftBound + (150 * initialSpan) / 2 / 400).toBeCloseTo(anchorX, 10);
    expect(zoomed.topBound + (100 * initialSpan) / 2 / 400).toBeCloseTo(anchorY, 10);
    expect(move.defaultPrevented).toBe(true);
    touch('touchmove', [
      [100, 100],
      [200, 100],
    ]);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan, 10);
    touch('touchend', []);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound, 10);
  });

  it('pans with one finger without drawing a zoom rectangle', () => {
    const initial = coordinates();
    touch('touchstart', [[100, 100]]);
    touch('touchmove', [[120, 130]]);
    expect(coordinates().leftBound).toBeCloseTo(initial.leftBound - (20 * initialSpan) / 400, 10);
    expect(coordinates().topBound).toBeCloseTo(initial.topBound - (30 * initialSpan) / 400, 10);
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan, 10);
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
    expect(coordinates().rightBound - coordinates().leftBound).toBeCloseTo(initialSpan / 2, 10);
    expect(coordinates().leftBound).toBeCloseTo(zoomed.leftBound - (10 * initialSpan) / 2 / 400, 10);
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
