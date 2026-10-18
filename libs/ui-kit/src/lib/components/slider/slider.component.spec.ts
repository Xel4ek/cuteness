import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ZardSliderComponent } from './slider.component';

describe('single-value slider', () => {
  async function slider(min: number, max: number, value: number, step = 1) {
    await TestBed.configureTestingModule({ imports: [ZardSliderComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ZardSliderComponent);
    fixture.componentRef.setInput('zAriaLabel', 'Value');
    fixture.componentRef.setInput('zMin', min);
    fixture.componentRef.setInput('zMax', max);
    fixture.componentRef.setInput('zStep', step);
    fixture.componentRef.setInput('zValue', value);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    return { fixture, input };
  }

  it('positions vertices relative to their minimum', async () => {
    const { input } = await slider(3, 100, 30);
    expect(Number.parseFloat(input.style.getPropertyValue('--range-fill'))).toBeCloseTo(((30 - 3) / 97) * 100);
    expect(input.value).toBe('30');
    expect(input.min).toBe('3');
    expect(input.max).toBe('100');
  });

  it('preserves scene values above 100', async () => {
    const { input } = await slider(100, 50000, 2000, 100);
    expect(input.value).toBe('2000');
    expect(input.max).toBe('50000');
    expect(input.step).toBe('100');
  });

  it('emits fractional input as a scalar number', async () => {
    const { fixture, input } = await slider(0, 1, 0.5, 0.01);
    const emitted: number[] = [];
    fixture.componentInstance.zValue.subscribe((value) => emitted.push(value));
    input.value = '0.51';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(emitted).toEqual([0.51]);
    expect(input.style.getPropertyValue('--range-fill')).toBe('51%');
  });

  it('uses the native disabled state while an algorithm is running', async () => {
    const { fixture, input } = await slider(3, 100, 30);
    fixture.componentRef.setInput('zDisabled', true);
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.value).toBe('30');
  });
});
