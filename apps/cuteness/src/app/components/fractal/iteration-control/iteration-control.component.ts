import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  model,
  output,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { clamp } from 'es-toolkit/math';

@Component({
  selector: 'cuteness-iteration-control',
  templateUrl: './iteration-control.component.html',
  styleUrl: './iteration-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IterationControlComponent implements FormValueControl<number> {
  public readonly value = model.required<number>();
  public readonly disabled = input(false);
  public readonly touch = output<void>();

  private readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly draft = linkedSignal(() => String(this.value()));
  protected readonly candidate = computed(() => {
    const text = this.draft();

    return clamp(text === '' ? this.value() : Number(text), 100, 50000);
  });

  public focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }

  protected edit(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = /^\d*$/.test(input.value) ? input.value : String(this.value());
    input.value = value;
    this.draft.set(value);
  }

  protected commit(step = 0): void {
    if (this.disabled()) {
      return;
    }

    const value = clamp(this.candidate() + step, 100, 50000);
    this.value.set(value);
    this.draft.set(String(value));
  }
}
