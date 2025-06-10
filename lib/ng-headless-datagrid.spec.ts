import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgHeadlessDatagrid } from './ng-headless-datagrid';

describe('NgHeadlessDatagrid', () => {
  let component: NgHeadlessDatagrid;
  let fixture: ComponentFixture<NgHeadlessDatagrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgHeadlessDatagrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgHeadlessDatagrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
