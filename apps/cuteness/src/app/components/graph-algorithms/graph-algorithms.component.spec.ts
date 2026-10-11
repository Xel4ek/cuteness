import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphAlgorithmsComponent } from './graph-algorithms.component';

import { afterEach, beforeEach, it, expect, describe, vi } from 'vitest';

describe('GraphAlgorithmsComponent', () => {
  let component: GraphAlgorithmsComponent;
  let fixture: ComponentFixture<GraphAlgorithmsComponent>;

  beforeEach(async () => {
    // jsdom has no Web Workers; keep the browser boundary local to this suite.
    vi.stubGlobal(
      'Worker',
      class {
        public onmessage: Worker['onmessage'] = null;
        public postMessage = vi.fn();
        public terminate = vi.fn();
      },
    );

    await TestBed.configureTestingModule({
      imports: [GraphAlgorithmsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphAlgorithmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
