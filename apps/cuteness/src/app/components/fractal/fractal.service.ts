import {ElementRef, Injectable} from '@angular/core';
import {animationFrames, fromEvent, withLatestFrom} from "rxjs";

@Injectable({
  providedIn: 'any',
})
export class FractalService {
  private canvasElement?: HTMLCanvasElement;
  private width!: number;
  private height!: number;

  public bindCanvas(canvasElement: ElementRef<HTMLCanvasElement>) {
    this.canvasElement = canvasElement.nativeElement;
    this.width = 300; //this.canvasElement.width;
    this.height = 150; //this.canvasElement.height;
  }

  public draw() {
    const context = this.canvasElement?.getContext('2d');
    const img = context?.getImageData(0, 0, this.width, this.height);
    if (img && context && this.canvasElement) {
      fromEvent<PointerEvent>(this.canvasElement, 'pointermove').pipe(
        withLatestFrom(animationFrames())
      ).subscribe(([e, d]) => {
        for (let x = 0; x < this.width; x++) {
          for (let y = 0; y < this.height; y++) {
            const value = this.formula(x, y, e.clientX, e.clientY, 2);
            const offset = (y * this.width + x) * 4;
            img.data[offset] = value[0] * 255;
            img.data[offset + 1] = value[1] * 255;
            img.data[offset + 2] = value[2] * 255;
            img.data[offset + 3] = 255;
          }
        }
        context.putImageData(img, 0, 0)
      })

    }
  }

  private formula(x: number, y: number, cx: number, cy: number, m: number) {
      x = (2*x-this.width)/this.width;
      y = (2*y-this.height)/this.width;
      for (let  i=0; i<10; i++) {
        x = Math.abs(x);
        y = Math.abs(y);
        m = x*x + y*y;
        x = x/m - cx/this.width;
        y = y/m - cy/this.height;
      }

      return [x, y, Math.sqrt(x*x+y*y)/2.]
  }
}
