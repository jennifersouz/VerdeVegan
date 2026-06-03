import { Component, OnInit } from '@angular/core';
import { Pedido, Pedidos } from 'src/app/services/pedidos';
import { PerfilService } from 'src/app/services/perfil';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage implements OnInit {
  pedidos: Pedido[] = [];
  pesquisa = '';
  estadoSelecionado = 'Todos';
  estados = ['Todos', 'Entregues', 'A caminho', 'Cancelados'];
  estaLogado = false;
  filtrosAberto = false;
  mesSelecionado = 'Todos';
  anoSelecionado = 'Todos';
  meses = [
    'Todos',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];

  constructor(
    private pedidosService: Pedidos,
    private perfilService: PerfilService
  ) { }

  ngOnInit() {
    this.carregarPedidos();
  }

  ionViewWillEnter() {
    this.carregarPedidos();
  }

  async carregarPedidos() {
    const perfil = await this.perfilService.obterPerfil();
    this.estaLogado = !!perfil;
    this.pedidos = this.estaLogado ? this.pedidosService.obterPedidos() : [];
  }

  get pedidosFiltrados(): Pedido[] {
    const pesquisa = this.pesquisa.trim().toLowerCase();

    return this.pedidos.filter((pedido: Pedido) => {
      const correspondePesquisa =
        !pesquisa ||
        pedido.nome.toLowerCase().includes(pesquisa) ||
        pedido.morada.toLowerCase().includes(pesquisa) ||
        pedido.pagamento.toLowerCase().includes(pesquisa);

      const correspondeEstado =
        this.estadoSelecionado === 'Todos' ||
        pedido.estado.toLowerCase().includes(this.estadoSelecionado.toLowerCase());

      return correspondePesquisa && correspondeEstado;
    });
  }

  selecionarEstado(estado: string) {
    this.estadoSelecionado = estado;
  }

  abrirFiltros() {
    this.filtrosAberto = true;
  }

  fecharFiltros() {
    this.filtrosAberto = false;
  }

  selecionarMes(mes: string) {
    this.mesSelecionado = mes;
  }

  limparFiltros() {
    this.mesSelecionado = 'Todos';
    this.anoSelecionado = 'Todos';
  }

  aplicarFiltros() {
    this.filtrosAberto = false;
  }
}
