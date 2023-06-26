import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Route } from '@angular/router';
import { FractalService } from './fractal.service';
import { FullScreenDirective } from './directives/full-screen/full-screen.directive';

@Component({
  selector: 'cuteness-fractal',
  standalone: true,
  imports: [CommonModule, FullScreenDirective],
  templateUrl: './fractal.component.html',
  styleUrls: ['./fractal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FractalComponent implements AfterViewInit {
  @ViewChild('canvasElement', { static: true }) private readonly canvasElement!: ElementRef<HTMLCanvasElement>;

  constructor(private readonly fractalService: FractalService, private readonly ngZone: NgZone) {}

  public ngAfterViewInit(): void {
    this.fractalService.bindCanvas(this.canvasElement);
    this.ngZone.runOutsideAngular(() => {
      this.fractalService.draw();
    });
  }
}

export default [{ path: '', component: FractalComponent }] as Route[];
