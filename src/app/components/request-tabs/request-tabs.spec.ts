import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestTabs } from './request-tabs';

describe('RequestTabs', () => {
  let component: RequestTabs;
  let fixture: ComponentFixture<RequestTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestTabs],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestTabs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
