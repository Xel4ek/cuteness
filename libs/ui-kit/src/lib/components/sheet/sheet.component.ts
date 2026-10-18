import { Component, ElementRef, afterRenderEffect, input, model, viewChild } from '@angular/core';

import { ZardButtonComponent } from '../button/button.component';

@Component({
  selector: 'z-sheet',
  imports: [ZardButtonComponent],
  template: `
    <dialog #dialog [attr.aria-label]="zLabel()" (close)="zVisible.set(false)" (pointerdown)="closeBackdrop($event)">
      <div class="content">
        <button type="button" z-button zType="ghost" zSize="icon" class="close" aria-label="Close navigation" (click)="zVisible.set(false)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
        <ng-content />
      </div>
    </dialog>
  `,
  styleUrl: './sheet.component.scss',
})
export class ZardSheetComponent {
  public readonly zVisible = model(false);
  public readonly zLabel = input.required<string>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;

      if (this.zVisible()) {
        dialog.showModal();
      } else {
        dialog.close();
      }
    });
  }

  protected closeBackdrop(event: PointerEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.zVisible.set(false);
    }
  }
}
