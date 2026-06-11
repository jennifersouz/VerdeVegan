import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoradasPage } from './moradas.page';

describe('MoradasPage', () => {
  let component: MoradasPage;
  let fixture: ComponentFixture<MoradasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MoradasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
