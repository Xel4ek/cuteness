import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatrixComponent } from '../matrix/matrix.component';

@Component({
  selector: 'cuteness-matrix-preview',
  imports: [MatButtonModule, MatIconModule, MatrixComponent],
  templateUrl: './matrix-preview.component.html',
  styleUrl: './matrix-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
