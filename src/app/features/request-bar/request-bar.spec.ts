import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestBar } from './request-bar';

describe('RequestBar', () => {
  let component: RequestBar;
  let fixture: ComponentFixture<RequestBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestBar],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
