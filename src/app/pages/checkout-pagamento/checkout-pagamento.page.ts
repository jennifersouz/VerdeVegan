import { Component } from '@angular/core';

@Component({
  selector: 'app-checkout-pagamento',
  templateUrl: './checkout-pagamento.page.html',
  styleUrls: ['./checkout-pagamento.page.scss'],
  standalone: false,
})
export class CheckoutPagamentoPage {
  metodoSelecionado = 'mbway';
  etapaAtual = 4;

  etapasCheckout = [
    { numero: 1, nome: 'Carrinho' },
    { numero: 2, nome: 'Descontos' },
    { numero: 3, nome: 'Morada' },
    { numero: 4, nome: 'Pagamento' },
    { numero: 5, nome: 'Confirmação' }
  ];

  selecionarMetodo(metodo: string) {
    this.metodoSelecionado = metodo;
  }

  obterNomeEtapaAtual(): string {
    const etapa = this.etapasCheckout.find(e => e.numero === this.etapaAtual);
    return etapa ? etapa.nome : '';
  }
}
