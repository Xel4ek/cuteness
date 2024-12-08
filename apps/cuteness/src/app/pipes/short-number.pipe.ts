import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortNumber',
  pure: true,
})
export class ShortNumberPipe implements PipeTransform {
  private powers = [
    { key: 'Q', value: 1e15 },
    { key: 'T', value: 1e12 },
    { key: 'B', value: 1e9 },
    { key: 'M', value: 1e6 },
    { key: 'k', value: 1e3 },
  ];

  public transform(value: number, precision = 1): string {
    const rounder = Math.pow(10, precision);
    let abs = Math.abs(Math.round(value * rounder)) / rounder;
    const isNegative = value < 0;
    let key = '';


    for (let i = 0; i < this.powers.length; i++) {
      const reduced = Math.round(abs / this.powers[i].value * rounder) / rounder;

      if (reduced >= 1) {
        abs = reduced;
        key = this.powers[i].key;
        break;
      }
    }

    return (isNegative ? '-' : '') + abs + key;
  }
}
