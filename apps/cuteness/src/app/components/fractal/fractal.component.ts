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

@Component({
  selector: 'cuteness-fractal',
  imports: [CommonModule, FullScreenDirective, MatButtonModule],
  templateUrl: './fractal.component.html',
  styleUrls: ['./fractal.component.scss'],
  providers: [ShortNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FractalComponent implements AfterViewInit, OnDestroy {
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

  constructor(
    private readonly mainLayoutHeaderService: MainLayoutHeaderService,
    private readonly shortNumberPipe: ShortNumberPipe,
  ) { }


  public ngOnDestroy(): void {
    this.worker.terminate();
  }

  public ngAfterViewInit(): void {
    this.controlContext = this.controlCanvasElement.nativeElement.getContext('2d');
    if (this.controlContext) {
      this.controlContext.lineWidth = 2;
      this.controlContext.strokeStyle = 'orange';
    }

    const ctx = this.canvasElement.nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('Oops');
    }

    ctx.font = "400 14px / 20px Roboto, sans-serif";
    ctx.fillStyle = 'silver';
    this.setBound();
    const iData = ctx.createImageData(this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height);

    this.worker.onmessage = ({ data: { data, type, time } }) => {

      switch (type) {
        case 'IMG':
          iData.data.set(data);
          ctx.putImageData(iData, 0, 0);
          this.mainLayoutHeaderService.setHeaderInfo({
            zoom: this.shortNumberPipe.transform(3 / (this.rightBound - this.leftBound), 2),
            render: time,
          })
          this.lock = false;
          break;
        case 'READY':
          this.render();
          break;
      }
    };
  }

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
      const height = Math.sign(width * (event.offsetY - offsetY)) * width / this.canvasElement.nativeElement.width * this.canvasElement.nativeElement.height;
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

      let rightBound = Math.max(offsetX, event.offsetX);
      const leftBound = Math.min(offsetX, event.offsetX);

      if (rightBound == leftBound) {
        rightBound += 1;
      }

      const width = event.offsetX - offsetX;
      const height = Math.sign(width * (event.offsetY - offsetY)) * width / this.canvasElement.nativeElement.width * this.canvasElement.nativeElement.height;

      this.leftBound += leftBound * perPixel;
      this.rightBound += (rightBound - this.canvasElement.nativeElement.offsetWidth) * perPixel;
      this.topBound += Math.min(offsetY, offsetY + height) * perPixel;
      this.render();
    }

    this.controlContext?.clearRect(0, 0, this.controlCanvasElement.nativeElement.width, this.controlCanvasElement.nativeElement.height);
    this.startEvent = null;
  }

  @HostListener('contextmenu', ['$event'])
  protected reset(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.lock) {
      this.setBound();
      this.render();
    }
  }

  private render() {
    this.lock = true;
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
