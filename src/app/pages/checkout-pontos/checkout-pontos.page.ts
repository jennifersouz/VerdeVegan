import { Component } from '@angular/core';

@Component({
  selector: 'app-checkout-pontos',
  templateUrl: './checkout-pontos.page.html',
  styleUrls: ['./checkout-pontos.page.scss'],
  standalone: false,
})
export class CheckoutPontosPage {
  codigoDesconto = '';
  pontosUsados = 0;
  etapaAtual = 2;

  etapasCheckout = [
    { numero: 1, nome: 'Carrinho' },
    { numero: 2, nome: 'Descontos' },
    { numero: 3, nome: 'Morada' },
    { numero: 4, nome: 'Pagamento' },
    { numero: 5, nome: 'Confirmação' }
  ];

  totalBase = 58;
  pontosDisponiveis = 120;

  get totalFinal() {
    const descontoPontos = this.pontosUsados / 10;
    return Math.max(this.totalBase - descontoPontos, 0);
  }

  usarTodosPontos() {
    this.pontosUsados = this.pontosDisponiveis;
  }

  obterNomeEtapaAtual(): string {
    const etapa = this.etapasCheckout.find(e => e.numero === this.etapaAtual);
    return etapa ? etapa.nome : '';
  }
}
