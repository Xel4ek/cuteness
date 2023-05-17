import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntColonyComponent } from './ant-colony.component';

describe('AntColonyComponent', () => {
  let component: AntColonyComponent;
  let fixture: ComponentFixture<AntColonyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AntColonyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AntColonyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
