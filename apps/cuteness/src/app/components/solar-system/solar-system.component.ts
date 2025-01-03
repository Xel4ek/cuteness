import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { FullScreenDirective } from '../fractal/directives/full-screen/full-screen.directive';


@Component({
  selector: 'cuteness-solar-system',
  imports: [CommonModule, MatButton, FullScreenDirective],
  templateUrl: './solar-system.component.html',
  styleUrl: './solar-system.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SolarSystemComponent implements AfterViewInit {
  // private readonly worker = new Worker(new URL('./solar-system.worker.ts', import.meta.url), { type: 'module' });
  @ViewChild('canvasElement', { static: true })
  private readonly canvasElement!: ElementRef<HTMLCanvasElement>;
  protected render() {}

  public ngAfterViewInit(): void {
    const offscreenCanvas = this.canvasElement.nativeElement.transferControlToOffscreen();

    // this.worker.postMessage({ offscreenCanvas, type: 'init' }, [offscreenCanvas]);
  }
}

