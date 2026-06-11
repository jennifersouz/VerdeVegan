import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalhePratoPage } from './detalhe-prato.page';

describe('DetalhePratoPage', () => {
  let component: DetalhePratoPage;
  let fixture: ComponentFixture<DetalhePratoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhePratoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
