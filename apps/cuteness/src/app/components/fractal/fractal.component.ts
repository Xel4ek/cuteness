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
import { Route } from '@angular/router';
import { FullScreenDirective } from './directives/full-screen/full-screen.directive';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'cuteness-fractal',
  imports: [CommonModule, FullScreenDirective, MatButtonModule],
  templateUrl: './fractal.component.html',
  styleUrls: ['./fractal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FractalComponent implements AfterViewInit, OnDestroy {
  private readonly worker: Worker = new Worker(new URL('./fractal.worker.ts', import.meta.url));
  private startEvent: MouseEvent | null = null;

  private leftBound = -2.0;
  private rightBound = 1.0;
  private topBound = 1.0;

  @ViewChild('canvasElement', { static: true })
  private readonly canvasElement!: ElementRef<HTMLCanvasElement>;

  @ViewChild('control', { static: true })
  private readonly controlCanvasElement!: ElementRef<HTMLCanvasElement>;

  private controlContext: CanvasRenderingContext2D | null = null;

  private lock = true;

  public ngOnDestroy(): void {
    this.worker.terminate();
  }

  public ngAfterViewInit(): void {
    this.controlContext = this.controlCanvasElement.nativeElement.getContext('2d');
    if (this.controlContext) {
      this.controlContext.strokeStyle = 'orange';
    }

    console.warn('component ngAfterViewInit', this.canvasElement.nativeElement.width);
    const ctx = this.canvasElement.nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('Oops');
    }

    this.setBound();
    const iData = ctx.createImageData(this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);

    this.worker.onmessage = ({ data: { data, type } }) => {
      console.warn('get data', type);

      switch (type) {
        case 'IMG':
          iData.data.set(data);
          ctx.putImageData(iData, 0, 0);
          this.lock = false;
          break;
        case 'READY':
          this.render();
          break;
      }
    };
  }

  // @HostListener('touchmove', ['$event'])
  // @HostListener('mousemove', ['$event'])
  // public draw(event: TouchEvent | MouseEvent): void {
  //   if (this.lock) {
  //     return;
  //   }
  //
  //   this.lock = true;
  //
  //   let clientX: number;
  //   let clientY: number;
  //
  //   if ('clientX' in event) {
  //     clientX = event.clientX;
  //     clientY = event.clientY;
  //   } else {
  //     clientX = event.touches[0].clientX;
  //     clientY = event.touches[0].clientY;
  //   }
  //
  //   const x = clientX - this.canvasElement.nativeElement.getBoundingClientRect().left;
  //   const y = clientY - this.canvasElement.nativeElement.getBoundingClientRect().top;
  //
  //   // Преобразуй координаты мыши в координаты фрактала
  //   const fractalX = (x / this.canvasElement.nativeElement.width) * 3.5 - 2;
  //   const fractalY = (y / this.canvasElement.nativeElement.height) * 3 - 1.5;
  //
  //   this.worker.postMessage({
  //     canvasWidth: this.canvasElement.nativeElement.width,
  //     canvasHeight: this.canvasElement.nativeElement.height,
  //     fractalX,
  //     fractalY,
  //   });
  // }

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  protected start(event: MouseEvent) {
    if (!this.lock && event.button === 0) {
      this.startEvent = event;
    }
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('mousemove', ['$event'])
  protected move(event: MouseEvent) {
    if (this.startEvent) {
      this.controlContext?.clearRect(0, 0, this.controlCanvasElement.nativeElement.width, this.controlCanvasElement.nativeElement.height);

      const { offsetX, offsetY } = this.startEvent;

      const width = event.offsetX - offsetX;
      const height = Math.sign(width* (event.offsetY - offsetY)) * width / this.canvasElement.nativeElement.width * this.canvasElement.nativeElement.height;
      this.controlContext?.strokeRect(
        offsetX,
        offsetY,
        width,
        height
      );
    }
  }

  @HostListener('touchend', ['$event'])
  @HostListener('mouseup', ['$event'])
  protected stop(event: MouseEvent) {
    if (this.startEvent) {
      const { offsetX, offsetY } = this.startEvent;
      const perPixel = (this.rightBound - this.leftBound) / this.canvasElement.nativeElement.offsetWidth;
      const rightBound = Math.max(offsetX, event.offsetX);
      const leftBound = Math.min(offsetX, event.offsetX);

      this.leftBound += leftBound * perPixel;
      this.rightBound += (rightBound - this.canvasElement.nativeElement.offsetWidth) * perPixel;
      this.topBound += offsetY * perPixel;
      this.render();
    }

    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.nativeElement.width, this.controlCanvasElement.nativeElement.height);
    this.startEvent = null;
  }

  @HostListener('contextmenu', ['$event'])
  protected reset(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.setBound();

    this.render();
  }

  private render() {
    this.lock = true;
    console.warn(this.leftBound, this.rightBound, this.topBound);
    this.worker.postMessage({
      canvasWidth: this.canvasElement.nativeElement.width,
      canvasHeight: this.canvasElement.nativeElement.height,
      rightBound: this.rightBound,
      leftBound: this.leftBound,
      topBound: this.topBound,
    });
  }

  private setBound() {
    this.rightBound = 1.0;
    this.leftBound = -2.0;
    this.topBound = (this.leftBound - this.rightBound) * this.canvasElement.nativeElement.height / this.canvasElement.nativeElement.width / 2;
  }
}

export default [{ path: '', component: FractalComponent }] as Route[];
