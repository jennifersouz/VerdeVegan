import { Component } from '@angular/core';

@Component({
  selector: 'app-checkout-pagamento',
  templateUrl: './checkout-pagamento.page.html',
  styleUrls: ['./checkout-pagamento.page.scss'],
  standalone: false,
})
export class CheckoutPagamentoPage {
  metodoSelecionado = 'mbway';

  selecionarMetodo(metodo: string) {
    this.metodoSelecionado = metodo;
  }
}