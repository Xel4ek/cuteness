import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef, HostListener,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route } from '@angular/router';
import { FullScreenDirective } from './directives/full-screen/full-screen.directive';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'cuteness-fractal',
  standalone: true,
  imports: [CommonModule, FullScreenDirective, MatButtonModule],
  templateUrl: './fractal.component.html',
  styleUrls: ['./fractal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FractalComponent implements AfterViewInit {
  private readonly worker: Worker;
  private lock = false;

  @ViewChild('canvasElement', { static: true })
  private readonly canvasElement!: ElementRef<HTMLCanvasElement>;

  constructor() {
    this.worker = new Worker(new URL('./fractal.worker.ts', import.meta.url));
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('mousemove', ['$event'])
  public draw(event: TouchEvent | MouseEvent): void {
    if (this.lock) {
      return;
    }

    this.lock = true;

    let clientX: number;
    let clientY: number;

    if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const x = clientX - this.canvasElement.nativeElement.getBoundingClientRect().left;
    const y = clientY - this.canvasElement.nativeElement.getBoundingClientRect().top;

    // Преобразуй координаты мыши в координаты фрактала
    const fractalX = (x / this.canvasElement.nativeElement.width) * 3.5 - 2;
    const fractalY = (y / this.canvasElement.nativeElement.height) * 3 - 1.5;



    this.worker.postMessage({
      canvasWidth: this.canvasElement.nativeElement.width,
      canvasHeight: this.canvasElement.nativeElement.height, fractalX, fractalY });
  }

  public ngAfterViewInit(): void {
    const ctx = this.canvasElement.nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('Oops');
    }

    const iData = ctx.createImageData(this.canvasElement.nativeElement.width, this.canvasElement.nativeElement.height)
    this.worker.onmessage = ({ data }) => {
      iData.data.set(data);
      ctx.putImageData(iData, 0, 0);
      // this.lock = false;
    };

    setTimeout(() => {
      ctx.fill();
      this.draw({ clientY: 0, clientX: 0 } as any);
    }, 1000)
  }

  public sendData(): void {
    this.worker.postMessage('uuuuu');
  }
}

export default [{ path: '', component: FractalComponent }] as Route[];
