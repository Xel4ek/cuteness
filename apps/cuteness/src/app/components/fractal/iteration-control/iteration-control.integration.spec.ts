import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FractalComponent from '../fractal.component';
import { MandelbrotWorkerCommand } from '../worker/mandelbrot-worker-command';
import { WorkerEvent } from '../worker/worker-event';
import { MandelbrotWorkerResult } from '../worker/mandelbrot-worker-result';

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
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'transferControlToOffscreen');
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', {
      configurable: true,
      value: () => ({ width: 400, height: 300 }),
    });

    try {
      await TestBed.configureTestingModule({ imports: [FractalComponent] }).compileComponents();
      const fixture = TestBed.createComponent(FractalComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const messages = () => postMessage.mock.calls.map(([message]) => message);
      expect(messages()[0].type).toBe(WorkerEvent.init);
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
      expect(messages()).toEqual([expect.objectContaining({ type: WorkerEvent.render, maxIteration: 3200 })]);

      const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas[cutenessSelectArea]');
      canvas.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.value).toBe('3200');
      expect(messages()).toHaveLength(1);
    } finally {
      if (original) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', original);
      } else {
        Reflect.deleteProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen');
      }
    }
  });
});
