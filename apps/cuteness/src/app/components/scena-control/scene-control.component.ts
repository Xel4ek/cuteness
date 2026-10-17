import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';

import { ControlAction } from './control-action';

@Component({
  selector: 'cuteness-scene-control',
  templateUrl: './scene-control.component.html',
  styleUrl: './scene-control.component.scss',
  imports: [MatLabel, FormsModule, MatSlider, MatSliderThumb, MatSelect, MatOption],
})
export class SceneControlComponent {
  @Input()
  public actionList: ControlAction[] = [];
}
