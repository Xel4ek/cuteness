import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy } from '@ng-icons/lucide';
import { ZardButtonComponent, ZardTooltipDirective } from '@cuteness/ui-kit';

import { ReplaceZeroWithInfinityPipe } from '../../../pipes/replace-zero-with-infinity.pipe';

@Component({
  selector: 'cuteness-matrix[adjacencyMatrix]',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.scss'],
  imports: [ZardTooltipDirective, DecimalPipe, ZardButtonComponent, NgIcon, ReplaceZeroWithInfinityPipe],
  providers: [provideIcons({ lucideCopy })],
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
