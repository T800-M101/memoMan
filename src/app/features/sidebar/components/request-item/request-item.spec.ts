import { TestBed } from '@angular/core/testing';

import { RequestItem } from './request-item';

describe('RequestItem', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestItem],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture =
      TestBed.createComponent(
        RequestItem,
      );

    fixture.componentRef.setInput(
      'method',
      'GET',
    );

    fixture.componentRef.setInput(
      'name',
      'Get Users',
    );

    fixture.detectChanges();

    expect(
      fixture.componentInstance,
    ).toBeTruthy();
  });
});
