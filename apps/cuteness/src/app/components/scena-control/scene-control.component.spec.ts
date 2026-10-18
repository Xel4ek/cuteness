import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SceneControlComponent } from './scene-control.component';

describe('scene controls with UI Kit', () => {
  it('sends numeric select values to the scene action', async () => {
    await TestBed.configureTestingModule({ imports: [SceneControlComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SceneControlComponent);
    const action = vi.fn();
    fixture.componentRef.setInput('actionList', [{ title: 'Detail', value: 2, values: [1, 2, 4], action }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.selectedIndex = 2;
    select.dispatchEvent(new Event('change'));
    expect(action).toHaveBeenLastCalledWith(4);
  });

  it('sends a single slider value to the scene action', async () => {
    await TestBed.configureTestingModule({ imports: [SceneControlComponent] }).compileComponents();
    const fixture = TestBed.createComponent(SceneControlComponent);
    const action = vi.fn();
    fixture.componentRef.setInput('actionList', [{ title: 'Speed', value: 200, min: 100, max: 1000, action }]);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type=range]') as HTMLInputElement;
    input.value = '500';
    input.dispatchEvent(new Event('input'));
    expect(action).toHaveBeenLastCalledWith(500);
  });
});
