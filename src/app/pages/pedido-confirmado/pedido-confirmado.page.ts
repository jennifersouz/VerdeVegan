import { Component, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Pedido, Pedidos } from 'src/app/services/pedidos';

@Component({
  selector: 'app-pedido-confirmado',
  templateUrl: './pedido-confirmado.page.html',
  styleUrls: ['./pedido-confirmado.page.scss'],
  standalone: false
})
export class PedidoConfirmadoPage implements OnDestroy {
  pedido: Pedido | null = null;
  numeroPedido = '';
  segundosParaInicio = 5;
  etapaAtual = 5;

  etapasCheckout = [
    { numero: 1, nome: 'Carrinho' },
    { numero: 2, nome: 'Descontos' },
    { numero: 3, nome: 'Morada' },
    { numero: 4, nome: 'Pagamento' },
    { numero: 5, nome: 'Confirmação' }
  ];

  private timeoutRedirecionamento?: ReturnType<typeof setInterval>;

  constructor(
    private pedidosService: Pedidos,
    private router: Router,
    private ngZone: NgZone
  ) { }

  async ionViewWillEnter() {
    const pedidos = await this.pedidosService.obterPedidos();
    this.pedido = pedidos[0] ?? null;
    this.numeroPedido = this.pedido?.codigo || '#VV';
    if (this.pedido) {
      this.router.navigateByUrl(`/tabs/detalhe-pedido/${this.pedido.id}`, { replaceUrl: true });
      return;
    }
    this.irParaInicio();
  }

  ionViewWillLeave() {
    this.limparRedirecionamento();
  }

  ngOnDestroy() {
    this.limparRedirecionamento();
  }

  public irParaInicio() {
    this.limparRedirecionamento();
    this.desfocarElementoAtivo();
    this.ngZone.run(() => {
      this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    });
  }

  public obterNomeEtapaAtual(): string {
    const etapa = this.etapasCheckout.find(e => e.numero === this.etapaAtual);
    return etapa ? etapa.nome : '';
  }

  private iniciarRedirecionamento() {
    this.segundosParaInicio = 5;
    this.limparRedirecionamento();

    this.timeoutRedirecionamento = setInterval(() => {
      this.ngZone.run(() => {
        this.segundosParaInicio = Math.max(0, this.segundosParaInicio - 1);

        if (this.segundosParaInicio <= 0) {
          this.irParaInicio();
        }
      });
    }, 1000);
  }

  private limparRedirecionamento() {
    if (this.timeoutRedirecionamento) {
      clearInterval(this.timeoutRedirecionamento);
      this.timeoutRedirecionamento = undefined;
    }
  }

  private desfocarElementoAtivo() {
    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }
}
