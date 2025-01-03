import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullScreenDirective } from './directives/full-screen/full-screen.directive';
import { MatButtonModule } from '@angular/material/button';
import { MainLayoutHeaderService } from '../../layouts/mail-layout/main-layout-header.service';
import { ShortNumberPipe } from '../../pipes/short-number.pipe';
import { WorkerEvent } from './worker/worker-event';
import { MandelbrotWorkerCommand } from './worker/mandelbrot-worker-command';
import { SceneControlComponent } from '../scena-control/scene-control.component';
import { ControlAction } from '../scena-control/control-action';
import { SelectAreaDirective } from './directives/select-area/select-area.directive';

@Component({
  selector: 'cuteness-fractal',
  imports: [CommonModule, FullScreenDirective, MatButtonModule, SceneControlComponent, SelectAreaDirective],
  templateUrl: './fractal.component.html',
  styleUrls: ['./fractal.component.scss'],
  providers: [ShortNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FractalComponent implements AfterViewInit, OnDestroy {
  private readonly worker: Worker = new Worker(new URL('./worker/fractal.worker.ts', import.meta.url), {
    type: 'module',
  });

  private leftBound = -2.0;
  private rightBound = 1.0;
  private topBound = 1.0;

  @ViewChild('control', { static: true })
  private readonly controlCanvasElement!: ElementRef<HTMLCanvasElement>;

  @ViewChild('offscreenCanvas', { static: true })
  private readonly offscreenCanvas!: ElementRef<HTMLCanvasElement>;

  private controlContext: CanvasRenderingContext2D | null = null;

  private lock = false;

  protected actionList: ControlAction[] = [
    {
      title: 'Max Iteration',
      value: 500,
      action: (value: number) => {
        this.postMessage({ type: WorkerEvent.settings, maxIteration: value });
      },
      values: [250, 500, 1000, 2500, 5000],
    },
  ];

  constructor(
    private readonly mainLayoutHeaderService: MainLayoutHeaderService,
    private readonly shortNumberPipe: ShortNumberPipe,
  ) {}

  public ngAfterViewInit(): void {
    this.controlContext = this.controlCanvasElement.nativeElement.getContext('2d');
    if (this.controlContext) {
      this.controlContext.lineWidth = 2;
      this.controlContext.strokeStyle = 'orange';
    }

    this.setBound();

    const offscreenCanvas = this.offscreenCanvas.nativeElement.transferControlToOffscreen();

    this.worker.postMessage({ type: WorkerEvent.init, offscreenCanvas }, [offscreenCanvas]);
  }

  public ngOnDestroy(): void {
    this.worker.terminate();
  }

  protected selectCoordinates({ startEvent, stopEvent }: { startEvent: MouseEvent; stopEvent: MouseEvent }) {
    const { offsetX, offsetY } = startEvent;
    const perPixel = (this.rightBound - this.leftBound) / this.offscreenCanvas.nativeElement.offsetWidth;

    let rightBound = Math.max(offsetX, stopEvent.offsetX);
    const leftBound = Math.min(offsetX, stopEvent.offsetX);

    if (rightBound == leftBound) {
      rightBound += 1;
    }

    const width = stopEvent.offsetX - offsetX;
    const height =
      ((Math.sign(width * (stopEvent.offsetY - offsetY)) * width) / this.offscreenCanvas.nativeElement.width) *
      this.offscreenCanvas.nativeElement.height;

    this.leftBound += leftBound * perPixel;
    this.rightBound += (rightBound - this.offscreenCanvas.nativeElement.offsetWidth) * perPixel;
    this.topBound += Math.min(offsetY, offsetY + height) * perPixel;
    this.render();
  }

  @HostListener('contextmenu', ['$event'])
  protected reset() {
    this.setBound();
    this.render();
  }

  private render() {
    console.warn(this.rightBound, this.leftBound, this.topBound);
    this.postMessage({
      type: WorkerEvent.coordinates,
      coordinates: {
        topBound: this.topBound,
        leftBound: this.leftBound,
        rightBound: this.rightBound,
      },
    });
    this.mainLayoutHeaderService.setHeaderInfo({
      zoom: this.shortNumberPipe.transform(3 / (this.rightBound - this.leftBound), 2),
    });

    // this.lock = true;

    // this.worker.postMessage({
    //   type: WorkerEvent.render,
    //   canvasWidth: this.offscreenCanvas.nativeElement.width,
    //   canvasHeight: this.offscreenCanvas.nativeElement.height,
    //   rightBound: this.rightBound,
    //   leftBound: this.leftBound,
    //   topBound: this.topBound,
    // });
  }

  private setBound() {
    this.rightBound = 1.0;
    this.leftBound = -2.0;
    this.topBound =
      ((this.leftBound - this.rightBound) * this.offscreenCanvas.nativeElement.height) /
      this.offscreenCanvas.nativeElement.width /
      2;
  }

  private postMessage(data: MandelbrotWorkerCommand) {
    this.worker.postMessage(data);
  }
}
