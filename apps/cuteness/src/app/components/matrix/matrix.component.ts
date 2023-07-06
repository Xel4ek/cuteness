import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReplaceZeroWithInfinityPipe } from '../pipe/replace-zero-with-infinity.pipe';

@Component({
  selector: 'cuteness-matrix[adjacencyMatrix]',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.scss'],
  standalone: true,
  imports: [MatTooltipModule, NgForOf, DecimalPipe, MatButtonModule, MatIconModule, ReplaceZeroWithInfinityPipe],
})
export class MatrixComponent {
  @Input()
  public adjacencyMatrix: number[][] = [];

  @Input()
  public solution?: number[];

  protected copyTableToClipboard() {
    const tableText = this.adjacencyMatrix.map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(tableText);
  }

  protected inSolution(row: number, col: number): boolean {
    const index = this.solution?.findIndex((i) => i === row) ?? -1;
    if (index >= 0) {
      return this.solution?.[index + 1] === col;
    }

    return false;
  }
}
