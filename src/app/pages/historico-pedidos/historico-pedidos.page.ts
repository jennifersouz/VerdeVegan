import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Pedido, Pedidos } from '../../services/pedidos';
import { PerfilService } from '../../services/perfil';

@Component({
  selector: 'app-historico-pedidos',
  templateUrl: './historico-pedidos.page.html',
  styleUrls: ['./historico-pedidos.page.scss'],
  standalone: false
})
export class HistoricoPedidosPage {
  public pedidos: Pedido[] = [];
  public carregando = true;

  constructor(
    private pedidosService: Pedidos,
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.carregarPedidos();
  }

  private async carregarPedidos() {
    this.carregando = true;

    try {
      const perfil = await this.perfilService.obterPerfil();
      this.pedidos = perfil
        ? this.pedidosService.obterPedidos(perfil.email).slice(0, 5)
        : [];
    } finally {
      this.carregando = false;
    }
  }

  public verTodos() {
    this.router.navigateByUrl('/tabs/pedidos');
  }

  public verDetalhes(pedido: Pedido) {
    this.router.navigate(['/tabs/detalhe-pedido', pedido.id.replace('#', '')]);
  }

  public textoDataItens(pedido: Pedido): string {
    const partesData = pedido.data.split('·');
    const data = partesData.length > 1 ? partesData[1].trim() : pedido.data;
    const itensTexto = pedido.itens === 1 ? '1 item' : `${pedido.itens} itens`;

    return `${data} · ${itensTexto}`;
  }
}
