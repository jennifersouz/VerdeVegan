import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonalizarPratoPage } from './personalizar-prato.page';

describe('PersonalizarPratoPage', () => {
  let component: PersonalizarPratoPage;
  let fixture: ComponentFixture<PersonalizarPratoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalizarPratoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
