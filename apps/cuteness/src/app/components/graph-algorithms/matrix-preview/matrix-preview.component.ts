import { Component, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGrid2X2, lucideX } from '@ng-icons/lucide';
import { ZardButtonComponent } from '@cuteness/ui-kit';

import { MatrixComponent } from '../matrix/matrix.component';

@Component({
  selector: 'cuteness-matrix-preview',
  templateUrl: './matrix-preview.component.html',
  styleUrl: './matrix-preview.component.scss',
  imports: [ZardButtonComponent, NgIcon, MatrixComponent],
  providers: [provideIcons({ lucideGrid2X2, lucideX })],
  host: {
    '(pointerenter)': 'hover($event, true)',
    '(pointerleave)': 'hover($event, false)',
    '(keydown.escape)': 'preview.set(false)',
    '(focusout)': 'leave($event)',
  },
})
export class MatrixPreviewComponent {
  public readonly adjacencyMatrix = input.required<number[][]>();
  public readonly solution = input<number[]>([]);
  protected readonly preview = signal(false);

  protected activate(): void {
    if (matchMedia('(hover: none)').matches) {
      this.preview.set(true);
    } else {
      this.download();
    }
  }

  protected hover(event: PointerEvent, visible: boolean): void {
    if (event.pointerType === 'mouse') {
      this.preview.set(visible);
    }
  }

  protected download(): void {
    const text = this.adjacencyMatrix()
      .map((row) => row.join('\t'))
      .join('\n');
    const link = document.createElement('a');
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
    link.download = 'tsp-matrix.txt';
    link.click();
  }

  protected leave(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;

    if (!host.contains(event.relatedTarget as Node | null)) {
      this.preview.set(false);
    }
  }
}
