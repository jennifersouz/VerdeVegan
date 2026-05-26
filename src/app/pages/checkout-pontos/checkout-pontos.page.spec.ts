import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutPontosPage } from './checkout-pontos.page';

describe('CheckoutPontosPage', () => {
  let component: CheckoutPontosPage;
  let fixture: ComponentFixture<CheckoutPontosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutPontosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
