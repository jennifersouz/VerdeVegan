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

  totalBase = 58;
  pontosDisponiveis = 120;

  get totalFinal() {
    const descontoPontos = this.pontosUsados / 10;
    return Math.max(this.totalBase - descontoPontos, 0);
  }

  usarTodosPontos() {
    this.pontosUsados = this.pontosDisponiveis;
  }
}