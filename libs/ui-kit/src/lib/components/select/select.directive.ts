import { Directive, computed, input } from '@angular/core';
import { twMerge } from 'tailwind-merge';

@Directive({
  selector: 'select[z-select]',
  host: { '[class]': 'classes()' },
})
export class ZardSelectDirective {
  public readonly class = input('');

  protected readonly classes = computed(() =>
    twMerge('h-8 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50', this.class()),
  );
}
