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

  get maximoPontosUsaveis() {
    return Math.min(this.pontosDisponiveis, Math.floor(this.totalBase * 10));
  }

  get pontosARedimir() {
    return Math.min(this.pontosUsados, this.maximoPontosUsaveis);
  }

  get totalFinal() {
    const descontoPontos = this.pontosARedimir / 10;
    return Math.max(this.totalBase - descontoPontos, 0);
  }

  usarTodosPontos() {
    this.pontosUsados = this.maximoPontosUsaveis;
  }

  validarPontosUsados() {
    const pontos = Number(this.pontosUsados) || 0;
    this.pontosUsados = Math.max(0, Math.min(Math.floor(pontos), this.maximoPontosUsaveis));
  }
}
