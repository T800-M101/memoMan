import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseSection } from './response-section';

describe('ResponseSection', () => {
  let component: ResponseSection;
  let fixture: ComponentFixture<ResponseSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponseSection],
    }).compileComponents();

    fixture = TestBed.createComponent(ResponseSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
