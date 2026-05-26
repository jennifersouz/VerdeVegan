import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutPagamentoPage } from './checkout-pagamento.page';

describe('CheckoutPagamentoPage', () => {
  let component: CheckoutPagamentoPage;
  let fixture: ComponentFixture<CheckoutPagamentoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutPagamentoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
