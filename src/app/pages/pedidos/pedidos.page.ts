import { Component } from '@angular/core';
import { Router } from '@angular/router';

type EstadoPedido = 'Entregue' | 'A caminho' | 'Em preparação';

interface Pedido {
  id: number;
  nome: string;
  data: string;
  hora: string;
  quantidadeItens: number;
  total: number;
  estado: EstadoPedido;
  grupo: 'Recente' | 'Esta semana' | 'Março';
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage {

  public filtroSelecionado: 'Todos' | 'Entregues' | 'A caminho' = 'Todos';

  public pedidos: Pedido[] = [];

  constructor(private router: Router) {}

  public selecionarFiltro(filtro: 'Todos' | 'Entregues' | 'A caminho') {
    this.filtroSelecionado = filtro;
  }

  public obterPedidosFiltrados(): Pedido[] {
    if (this.filtroSelecionado === 'Todos') {
      return this.pedidos;
    }

    if (this.filtroSelecionado === 'Entregues') {
      return this.pedidos.filter((pedido: Pedido) => pedido.estado === 'Entregue');
    }

    return this.pedidos.filter((pedido: Pedido) => pedido.estado === 'A caminho');
  }

  public obterPedidoRecente(): Pedido | undefined {
    return this.obterPedidosFiltrados().find((pedido: Pedido) => pedido.grupo === 'Recente');
  }

  public obterPedidosPorGrupo(grupo: 'Esta semana' | 'Março'): Pedido[] {
    return this.obterPedidosFiltrados().filter((pedido: Pedido) => pedido.grupo === grupo);
  }

  public temPedidos(): boolean {
    return this.obterPedidosFiltrados().length > 0;
  }

  public abrirPedido(id: number) {
    console.log('Abrir detalhe do pedido:', id);

    // tem q criar esta página:
    // this.router.navigateByUrl(`/tabs/detalhe-pedido/${id}`);
  }

  public irParaMenu() {
    this.router.navigateByUrl('/tabs/menu');
  }
}