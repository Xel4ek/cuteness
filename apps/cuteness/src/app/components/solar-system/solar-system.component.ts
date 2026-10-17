import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

import { FullScreenDirective } from '../fractal/directives/full-screen/full-screen.directive';

@Component({
  selector: 'cuteness-solar-system',
  templateUrl: './solar-system.component.html',
  styleUrl: './solar-system.component.scss',
  imports: [FullScreenDirective],
})
export default class SolarSystemComponent implements AfterViewInit, OnDestroy {
  private readonly worker = new Worker(new URL('./worker/solar-system.worker.ts', import.meta.url), { type: 'module' });
  @ViewChild('canvasElement', { static: true })
  private readonly canvasElement!: ElementRef<HTMLCanvasElement>;
  public ngOnDestroy(): void {
    this.worker.terminate();
  }

  public ngAfterViewInit(): void {
    const offscreenCanvas = this.canvasElement.nativeElement.transferControlToOffscreen();

    this.worker.postMessage({ offscreenCanvas, type: 'init' }, [offscreenCanvas]);
  }
}
