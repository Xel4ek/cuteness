import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphAlgorithmsComponent } from './graph-algorithms.component';

describe('AntColonyComponent', () => {
  let component: GraphAlgorithmsComponent;
  let fixture: ComponentFixture<GraphAlgorithmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphAlgorithmsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphAlgorithmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
