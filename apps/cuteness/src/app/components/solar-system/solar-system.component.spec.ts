import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SolarSystemComponent from './solar-system.component';

describe('solar-system worker lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('terminates its worker when the component is destroyed', () => {
    const terminate = vi.fn();
    vi.stubGlobal(
      'Worker',
      class {
        public terminate = terminate;
      },
    );

    const fixture = TestBed.createComponent(SolarSystemComponent);
    fixture.destroy();

    expect(terminate).toHaveBeenCalledOnce();
  });
});
