import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcompanharPedidoPage } from './acompanhar-pedido.page';

describe('AcompanharPedidoPage', () => {
  let component: AcompanharPedidoPage;
  let fixture: ComponentFixture<AcompanharPedidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AcompanharPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
