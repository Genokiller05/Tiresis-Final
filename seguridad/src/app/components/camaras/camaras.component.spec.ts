import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Camaras } from './camaras';

describe('Camaras', () => {
  let component: Camaras;
  let fixture: ComponentFixture<Camaras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Camaras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Camaras);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
