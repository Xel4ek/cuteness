import { Component, input } from '@angular/core';
import { twMerge } from 'tailwind-merge';

@Component({
  selector: 'z-spinner',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" [class]="twMerge('size-4 animate-spin', class())" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  `,
  host: { role: 'status', 'aria-label': 'Loading', class: 'inline-flex' },
})
export class ZardSpinnerComponent {
  public readonly class = input('');
  protected readonly twMerge = twMerge;
}
