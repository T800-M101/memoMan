import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionItem } from './collection-item';

describe('CollectionItem', () => {
  let component: CollectionItem;
  let fixture: ComponentFixture<CollectionItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionItem],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
