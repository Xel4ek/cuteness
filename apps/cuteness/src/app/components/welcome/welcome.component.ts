import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cuteness-welcome',
  imports: [],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {}
