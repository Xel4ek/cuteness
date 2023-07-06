import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceZeroWithInfinity',
  standalone: true,
})
export class ReplaceZeroWithInfinityPipe implements PipeTransform {
  public transform(value: string | null): string {
    return value === '0' ? '∞' : value ?? '';
  }
}
