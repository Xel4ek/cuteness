import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLabel } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ControlAction } from './control-action';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'cuteness-scene-control',
  imports: [CommonModule, MatLabel, FormsModule, MatSlider, MatSliderThumb, MatSelect, MatOption],
  templateUrl: './scene-control.component.html',
  styleUrl: './scene-control.component.scss',
})
export class SceneControlComponent {
  @Input()
  public actionList: ControlAction[] = [];
}
