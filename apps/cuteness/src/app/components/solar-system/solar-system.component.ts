import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { draw_triangle } from 'solar-system';


@Component({
  selector: 'cuteness-solar-system',
  imports: [CommonModule, MatButton],
  templateUrl: './solar-system.component.html',
  styleUrl: './solar-system.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SolarSystemComponent {
  protected render() {
    draw_triangle('someId', new Float32Array([1.0, 0.0, 0.0, 1.0]))
  }
}

