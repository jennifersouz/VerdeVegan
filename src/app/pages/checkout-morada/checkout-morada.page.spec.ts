import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutMoradaPage } from './checkout-morada.page';

describe('CheckoutMoradaPage', () => {
  let component: CheckoutMoradaPage;
  let fixture: ComponentFixture<CheckoutMoradaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutMoradaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
