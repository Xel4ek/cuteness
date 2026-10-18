import { Component, computed, input, model, numberAttribute } from '@angular/core';

@Component({
  selector: 'z-slider',
  template: `
    <input
      type="range"
      [min]="zMin()"
      [max]="zMax()"
      [step]="zStep()"
      [value]="zValue()"
      [disabled]="zDisabled()"
      [attr.aria-label]="zAriaLabel()"
      [style.--range-fill]="fill() + '%'"
      (input)="updateValue($event)"
    />
  `,
  styleUrl: './slider.component.scss',
})
export class ZardSliderComponent {
  public readonly zAriaLabel = input.required<string>();
  public readonly zMin = input(0, { transform: numberAttribute });
  public readonly zMax = input(100, { transform: numberAttribute });
  public readonly zStep = input(1, { transform: numberAttribute });
  public readonly zValue = model(0);
  public readonly zDisabled = input(false);

  protected readonly fill = computed(() => {
    const span = this.zMax() - this.zMin();

    return span > 0 ? ((this.zValue() - this.zMin()) / span) * 100 : 0;
  });

  protected updateValue(event: Event): void {
    this.zValue.set((event.target as HTMLInputElement).valueAsNumber);
  }
}
