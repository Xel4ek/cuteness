import { Directive, input } from '@angular/core';

@Directive({
  selector: '[zTooltip]',
  host: { '[attr.title]': 'zTooltip()' },
})
export class ZardTooltipDirective {
  public readonly zTooltip = input.required<string>();
}
