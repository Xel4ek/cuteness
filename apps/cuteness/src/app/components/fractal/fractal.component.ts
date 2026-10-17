import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Injector,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { signalMethod } from '@ngrx/signals';
import { Clipboard } from '@angular/cdk/clipboard';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { FullScreenDirective } from './directives/full-screen/full-screen.directive';
import { MainLayoutHeaderService } from '../../layouts/mail-layout/main-layout-header.service';
import { WorkerEvent } from './worker/worker-event';
import { MandelbrotWorkerCommand } from './worker/mandelbrot-worker-command';
import { MandelbrotWorkerResult } from './worker/mandelbrot-worker-result';
import { IterationControlComponent } from './iteration-control/iteration-control.component';
import { SelectAreaDirective } from './directives/select-area/select-area.directive';
import { CanvasCoordinates, CanvasTransform } from './canvas-coordinates';
import { frameProjection, FractalView, FractalViewport } from './fractal-viewport';
import { centerLabels, copyPosition, parsePosition } from './fractal-position';

interface FractalFrame {
  coordinates: FractalView;
  maxIteration: number;
  image: ImageBitmap;
}

@Component({
  selector: 'cuteness-fractal',
  imports: [FullScreenDirective, IterationControlComponent, SelectAreaDirective],
  templateUrl: './fractal.component.html',
  styleUrls: ['./fractal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FractalComponent implements AfterViewInit, OnDestroy {
  private readonly mainLayoutHeaderService = inject(MainLayoutHeaderService);
  private readonly injector = inject(Injector);
  private readonly clipboard = inject(Clipboard);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly worker: Worker = new Worker(new URL('./worker/fractal.worker.ts', import.meta.url), {
    type: 'module',
  });

  private readonly initialPosition = parsePosition(window.location.href);
  private readonly viewport = new FractalViewport(this.initialPosition?.coordinates);
  private inFlight?: Omit<FractalFrame, 'image'>;
  private frame?: FractalFrame;
  private animationFrame?: number;
  private frameContext: CanvasRenderingContext2D | null = null;

  @ViewChild('control', { static: true })
  private readonly controlCanvasElement!: ElementRef<HTMLCanvasElement>;

  @ViewChild('frameCanvas', { static: true })
  private readonly frameCanvas!: ElementRef<HTMLCanvasElement>;

  private controlContext: CanvasRenderingContext2D | null = null;

  protected readonly maxIteration = signal(this.initialPosition?.maxIteration ?? 2000);
  protected readonly center = signal(centerLabels(this.viewport.snapshot(), window.innerWidth));
  protected readonly copied = signal(false);
  protected readonly pasteMessage = signal('');
  private readonly updateIterations = signalMethod<number>(() => this.render());

  public ngAfterViewInit(): void {
    this.controlContext = this.controlCanvasElement.nativeElement.getContext('2d');
    if (this.controlContext) {
      this.controlContext.lineWidth = 2;
      this.controlContext.strokeStyle = 'orange';
    }

    const canvas = this.frameCanvas.nativeElement;
    this.frameContext = canvas.getContext('2d', { alpha: false });
    const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);

    this.worker.onmessage = ({ data }: MessageEvent<MandelbrotWorkerResult>) => {
      if (data.type !== 'rendered') {
        return;
      }
      const requested = this.inFlight;
      if (!requested) {
        data.image.close();

        return;
      }
      this.frame?.image.close();
      this.frame = { ...requested, image: data.image };
      this.inFlight = undefined;
      this.drawFrame();
      if (this.isCurrent(requested)) {
        this.updateHeader(data.renderTimeMs);
      }
      this.requestFrame();
    };
    this.postMessage(
      {
        type: WorkerEvent.init,
        offscreenCanvas,
        coordinates: this.viewport.snapshot(),
        maxIteration: this.maxIteration(),
      },
      [offscreenCanvas],
    );
    this.updateIterations(this.maxIteration, { injector: this.injector });
  }

  public ngOnDestroy(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.frame?.image.close();
    this.worker.onmessage = null;
    this.worker.terminate();
  }

  protected selectCoordinates({
    startEvent,
    stopEvent,
  }: {
    startEvent: CanvasCoordinates;
    stopEvent: CanvasCoordinates;
  }) {
    const canvas = this.frameCanvas.nativeElement;
    this.pasteMessage.set('');
    this.viewport.select(startEvent, stopEvent, canvas.width, canvas.height);
    this.render();
  }

  protected transformCoordinates(change: CanvasTransform) {
    const canvas = this.frameCanvas.nativeElement;
    this.pasteMessage.set('');
    this.viewport.transform(change, canvas.width, canvas.height);
    this.render();
  }

  protected reset() {
    this.pasteMessage.set('');
    this.viewport.reset();
    this.render();
  }

  protected copyCenter(): void {
    this.pasteMessage.set('');
    const route = this.router.createUrlTree(['/fractal'], {
      queryParams: { position: copyPosition(this.viewport.snapshot(), this.maxIteration()) },
    });
    const path = this.location.prepareExternalUrl(this.router.serializeUrl(route));
    this.copied.set(this.clipboard.copy(new URL(path, document.baseURI).href));
  }

  @HostListener('contextmenu', ['$event'])
  protected pasteCenter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.copied.set(false);
    if (!navigator.clipboard?.readText) {
      this.reset();
      this.pasteMessage.set('Starting view restored');

      return;
    }
    void navigator.clipboard.readText().then(
      (text) => {
        const position = parsePosition(text);
        if (position) {
          this.viewport.restore(position.coordinates);
          if (position.maxIteration !== undefined) {
            this.maxIteration.set(position.maxIteration);
          }
          this.render();
        } else {
          this.reset();
        }
        this.pasteMessage.set(position ? 'Position pasted' : 'Starting view restored');
      },
      () => {
        this.reset();
        this.pasteMessage.set('Starting view restored · Allow clipboard access to paste a position');
      },
    );
  }

  private render() {
    this.center.set(centerLabels(this.viewport.snapshot(), this.frameCanvas.nativeElement.width));
    this.copied.set(false);
    this.updateHeader();
    this.drawFrame();
    this.requestFrame();
  }

  private isCurrent(frame: Omit<FractalFrame, 'image'>): boolean {
    const current = this.viewport.snapshot();

    return (
      frame.maxIteration === this.maxIteration() &&
      frame.coordinates.precision === current.precision &&
      frame.coordinates.span === current.span &&
      frame.coordinates.centerRe === current.centerRe &&
      frame.coordinates.centerIm === current.centerIm
    );
  }

  private requestFrame(): void {
    if (this.inFlight || (this.frame && this.isCurrent(this.frame))) {
      return;
    }
    this.postMessage({
      type: WorkerEvent.render,
      coordinates: this.viewport.snapshot(),
      maxIteration: this.maxIteration(),
    });
  }

  private drawFrame(): void {
    const context = this.frameContext;
    if (!context || !this.frame || this.animationFrame !== undefined) {
      return;
    }
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = undefined;
      const frame = this.frame;
      if (!frame) {
        return;
      }
      const canvas = this.frameCanvas.nativeElement;
      const projection = frameProjection(frame.coordinates, this.viewport.snapshot(), canvas.width, canvas.height);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(projection.scale, 0, 0, projection.scale, projection.x, projection.y);
      context.drawImage(frame.image, 0, 0);
    });
  }

  private updateHeader(renderTimeMs = 0): void {
    const render = renderTimeMs >= 1000 ? `${(renderTimeMs / 1000).toFixed(2)} s` : `${Math.round(renderTimeMs)} ms`;
    this.mainLayoutHeaderService.setHeaderInfo({
      zoom: this.viewport.zoomLabel(),
      ...(renderTimeMs > 100 ? { render } : {}),
    });
  }

  private postMessage(data: MandelbrotWorkerCommand, transfer: Transferable[] = []) {
    this.inFlight = { coordinates: data.coordinates, maxIteration: data.maxIteration };
    this.worker.postMessage(data, transfer);
  }
}
