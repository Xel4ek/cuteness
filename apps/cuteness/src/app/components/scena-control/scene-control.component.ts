import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { MatLabel } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ControlAction } from './control-action';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'cuteness-scene-control',
  imports: [MatLabel, FormsModule, MatSlider, MatSliderThumb, MatSelect, MatOption],
  templateUrl: './scene-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './scene-control.component.scss',
})
export class SceneControlComponent {
  @Input()
  public actionList: ControlAction[] = [];
}
