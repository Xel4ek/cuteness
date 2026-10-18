import { Component, computed, input } from '@angular/core';
import { twMerge } from 'tailwind-merge';

@Component({
  selector: 'button[z-button], a[z-button]',
  template: '<ng-content />',
  host: {
    '[class]': 'classes()',
    '[attr.data-icon-only]': 'zSize() === "icon" ? "" : null',
  },
})
export class ZardButtonComponent {
  public readonly zType = input<'default' | 'ghost'>('default');
  public readonly zSize = input<'default' | 'icon'>('default');
  public readonly class = input('');

  protected readonly classes = computed(() =>
    twMerge(
      'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
      this.zType() === 'ghost' ? 'hover:bg-muted hover:text-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/85',
      this.zSize() === 'icon' ? 'size-8' : 'h-8 px-2.5',
      this.class(),
    ),
  );
}
