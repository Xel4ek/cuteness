import { TestBed } from '@angular/core/testing';
import { provideRouter, withHashLocation } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import FractalComponent from '../fractal.component';
import { MandelbrotWorkerCommand } from '../worker/mandelbrot-worker-command';
import { MandelbrotWorkerResult } from '../worker/mandelbrot-worker-result';
import { WorkerEvent } from '../worker/worker-event';

describe('fractal iteration settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends form settings after worker initialization and only when editing is committed', async () => {
    const postMessage = vi.fn<(message: MandelbrotWorkerCommand, transfer?: Transferable[]) => void>();
    const worker: {
      onmessage: ((event: MessageEvent<MandelbrotWorkerResult>) => void) | null;
      postMessage: typeof postMessage;
      terminate: () => void;
    } = { onmessage: null, postMessage, terminate: vi.fn() };
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
    vi.stubGlobal(
      'ResizeObserver',
      class {
        public observe = vi.fn();
        public disconnect = vi.fn();
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [FractalComponent],
      providers: [provideRouter([], withHashLocation())],
    }).compileComponents();
    const fixture = TestBed.createComponent(FractalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const messages = () => postMessage.mock.calls.map(([message]) => message);
    expect(messages()[0].type).toBe(WorkerEvent.Init);
    expect(messages()).toHaveLength(1);
    expect(messages()[0].maxIteration).toBe(2000);
    worker.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'rendered',
          referenceCount: 1,
          referencesBuilt: 1,
          renderTimeMs: 0,
          image: { width: 400, height: 300, close: vi.fn() },
        } satisfies MandelbrotWorkerResult,
      }),
    );
    postMessage.mockClear();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('cuteness-iteration-control input');
    input.value = '3200';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(postMessage).not.toHaveBeenCalled();
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(messages()).toEqual([expect.objectContaining({ type: WorkerEvent.Render, maxIteration: 3200 })]);

    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas[cutenessSelectArea]');
    canvas.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('3200');
    expect(messages()).toHaveLength(1);
  });
});
