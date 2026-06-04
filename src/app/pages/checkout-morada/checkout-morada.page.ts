import { Component } from '@angular/core';

@Component({
  selector: 'app-checkout-morada',
  templateUrl: './checkout-morada.page.html',
  styleUrls: ['./checkout-morada.page.scss'],
  standalone: false,
})
export class CheckoutMoradaPage {
  moradaSelecionada = 'casa';
  etapaAtual = 3;

  etapasCheckout = [
    { numero: 1, nome: 'Carrinho' },
    { numero: 2, nome: 'Descontos' },
    { numero: 3, nome: 'Morada' },
    { numero: 4, nome: 'Pagamento' },
    { numero: 5, nome: 'Confirmação' }
  ];

  selecionarMorada(morada: string) {
    this.moradaSelecionada = morada;
  }

  obterNomeEtapaAtual(): string {
    const etapa = this.etapasCheckout.find(e => e.numero === this.etapaAtual);
    return etapa ? etapa.nome : '';
  }
}
