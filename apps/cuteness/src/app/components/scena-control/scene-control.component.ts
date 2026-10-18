import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardSelectDirective, ZardSliderComponent } from '@cuteness/ui-kit';

import { ControlAction } from './control-action';

@Component({
  selector: 'cuteness-scene-control',
  templateUrl: './scene-control.component.html',
  styleUrl: './scene-control.component.scss',
  imports: [FormsModule, ZardSliderComponent, ZardSelectDirective],
})
export class SceneControlComponent {
  @Input()
  public actionList: ControlAction[] = [];
}
