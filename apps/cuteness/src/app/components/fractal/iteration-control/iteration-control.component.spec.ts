import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormField, disabled, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IterationControlComponent } from './iteration-control.component';

@Component({
  template: '<cuteness-iteration-control [formField]="settings.iterations" />',
  imports: [FormField, IterationControlComponent],
})
class IterationControlHost {
  public readonly data = signal({ iterations: 2000 });
  public readonly isDisabled = signal(false);
  public readonly settings = form(this.data, (path) => {
    disabled(path.iterations, { when: () => this.isDisabled() });
  });
}

describe('iteration control', () => {
  let fixture: ComponentFixture<IterationControlHost>;
  let control: IterationControlComponent;
  let input: HTMLInputElement;
  const emit = vi.fn<(value: number) => void>();

  function enter(value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function apply() {
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
  }

  function step(label: string) {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);
    button.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [IterationControlHost] }).compileComponents();
    fixture = TestBed.createComponent(IterationControlHost);
    fixture.detectChanges();
    control = fixture.debugElement.query(By.directive(IterationControlComponent)).componentInstance;
    input = fixture.nativeElement.querySelector('input');
    emit.mockClear();
    control.value.subscribe(emit);
  });

  it('starts at 2000 and applies steps of 100 immediately', () => {
    expect(input.value).toBe('2000');
    step('Increase iterations');
    expect(emit).toHaveBeenLastCalledWith(2100);
    expect(fixture.componentInstance.data().iterations).toBe(2100);
    step('Decrease iterations');
    expect(emit).toHaveBeenLastCalledWith(2000);
  });

  it('waits for Enter or blur before applying typed values and does not apply twice', () => {
    enter('3100');
    expect(emit).not.toHaveBeenCalled();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(emit).toHaveBeenCalledExactlyOnceWith(3100);
    apply();
    expect(emit).toHaveBeenCalledTimes(1);
    enter('3200');
    apply();
    expect(emit).toHaveBeenLastCalledWith(3200);
  });

  it('clamps to the limits and disables the corresponding button', () => {
    enter('999999');
    apply();
    expect(input.value).toBe('50000');
    expect(emit).toHaveBeenLastCalledWith(50000);
    expect(fixture.nativeElement.querySelector('button[aria-label="Increase iterations"]').disabled).toBe(true);
    enter('1');
    apply();
    expect(input.value).toBe('100');
    expect(fixture.nativeElement.querySelector('button[aria-label="Decrease iterations"]').disabled).toBe(true);
  });

  it('restores an empty field and rejects non-integer input without a new render', () => {
    enter('');
    apply();
    expect(input.value).toBe('2000');

    for (const value of ['1.5', '-20', '2e3', 'hello']) {
      enter(value);
      expect(input.value).toBe('2000');
    }

    expect(emit).not.toHaveBeenCalled();
  });

  it('steps from a pending edit and accepts updates from the parent', () => {
    enter('4500');
    step('Increase iterations');
    expect(emit).toHaveBeenCalledExactlyOnceWith(4600);
    fixture.componentInstance.data.set({ iterations: 7000 });
    fixture.detectChanges();
    expect(input.value).toBe('7000');
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('receives disabled state from the field and marks the field as touched on blur', () => {
    const host = fixture.componentInstance;
    expect(host.settings.iterations().touched()).toBe(false);
    apply();
    expect(host.settings.iterations().touched()).toBe(true);
    host.isDisabled.set(true);
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect([...fixture.nativeElement.querySelectorAll('button')].every((button: HTMLButtonElement) => button.disabled)).toBe(true);
    step('Increase iterations');
    expect(emit).not.toHaveBeenCalled();
    expect(host.data().iterations).toBe(2000);
    host.isDisabled.set(false);
    fixture.detectChanges();
    control.focus();
    expect(document.activeElement).toBe(input);
  });
});
