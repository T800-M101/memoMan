import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestItem } from './request-item';

describe('RequestItem', () => {
  let component: RequestItem;
  let fixture: ComponentFixture<RequestItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestItem],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
