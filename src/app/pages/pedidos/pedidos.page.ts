import { Component, OnDestroy, OnInit } from '@angular/core';
import { EstadoPedido, Pedido, Pedidos } from 'src/app/services/pedidos';
import { PerfilService } from 'src/app/services/perfil';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  pesquisa = '';
  estadoSelecionado = 'Todos';
  estados = ['Todos', 'Entregues', 'A caminho', 'A preparar', 'Cancelados'];
  estaLogado = false;
  filtrosAberto = false;
  mesSelecionado = 'Todos';
  anoSelecionado = 'Todos';
  agora = new Date();
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
  private readonly mesesTitulos = [
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO'
  ];
  private readonly anosPorPedido: Record<string, number> = {
    '#VV-1233': 2026,
    '#VV-8444': 2026,
    '#VV-7461': 2026,
    '#VV-3078': 2026,
    '#VV-2048': 2026,
    '#VV-2006': 2026,
    '#VV-2007': 2026,
    '#VV-2008': 2026,
    '#VV-2009': 2026,
    '#VV-2010': 2025,
    '#VV-2011': 2025,
    '#VV-2012': 2025,
    '#VV-2013': 2025,
    '#VV-2014': 2024,
    '#VV-2015': 2024,
    '#VV-2016': 2026,
    '#VV-2017': 2025,
    '#VV-2018': 2025,
    '#VV-2019': 2026,
    '#VV-2020': 2026
  };
  private temporizador?: ReturnType<typeof setInterval>;
  private pedidosRealtimeUnsubscribe: (() => void) | null = null;

  constructor(
    private pedidosService: Pedidos,
    private perfilService: PerfilService,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit() {
    this.carregarPedidos();
    this.iniciarTemporizador();
  }

  ionViewWillEnter() {
    this.agora = new Date();
    this.carregarPedidos();
    this.iniciarTemporizador();
  }

  ionViewWillLeave() {
    this.pararTemporizador();
  }

  ngOnDestroy() {
    this.pararTemporizador();
    this.pararRealtimePedidos();
  }

  async carregarPedidos() {
    const perfil = await this.perfilService.obterPerfil();
    this.estaLogado = !!perfil;
    await this.iniciarRealtimePedidos();

    if (!perfil) {
      this.pedidos = [];
      return;
    }

    const pedidosRemotos = await this.supabaseService.listarPedidos();
    const pedidos = pedidosRemotos.data || this.pedidosService.obterPedidos(perfil.email);
    this.pedidos = pedidos.map((pedido) => this.sincronizarEstadoPedido(pedido));
  }

  get pedidosFiltrados(): Pedido[] {
    const pesquisa = this.pesquisa.trim().toLowerCase();

    return this.pedidos.filter((pedido: Pedido) => {
      const correspondePesquisa =
        !pesquisa ||
        pedido.nome.toLowerCase().includes(pesquisa) ||
        pedido.morada.toLowerCase().includes(pesquisa) ||
        pedido.pagamento.toLowerCase().includes(pesquisa);

      const estadoFiltro = this.estadoSelecionado === 'Entregues'
        ? 'Entregue'
        : this.estadoSelecionado === 'Cancelados'
          ? 'Cancelado'
          : this.estadoSelecionado;
      const estadoAtual = this.estadoAtualPedido(pedido);
      const correspondeEstado =
        this.estadoSelecionado === 'Todos' ||
        estadoAtual.toLowerCase().includes(estadoFiltro.toLowerCase()) ||
        (estadoFiltro === 'A preparar' && estadoAtual === 'Recebido');

      const data = this.extrairDataPedido(pedido.dataIso || pedido.data);
      const correspondeMes =
        this.mesSelecionado === 'Todos' ||
        (!!data && data.mes === this.meses.indexOf(this.mesSelecionado));
      const correspondeAno =
        this.anoSelecionado === 'Todos' ||
        this.obterAnoPedido(pedido) === Number(this.anoSelecionado);

      return correspondePesquisa && correspondeEstado && correspondeMes && correspondeAno;
    });
  }

  estadoAtualPedido(pedido: Pedido): EstadoPedido {
    return this.pedidosService.obterEstadoAtual(pedido, this.agora);
  }

  get pedidosAcontecerAgora(): Pedido[] {
    return this.pedidosFiltrados.filter((pedido) => this.pedidoEstaAcontecerAgora(pedido));
  }

  get pedidosAgrupados(): { titulo: string; pedidos: Pedido[] }[] {
    const grupos = new Map<string, Pedido[]>();

    this.pedidosFiltrados
      .filter((pedido) => !this.pedidoEstaAcontecerAgora(pedido))
      .forEach((pedido) => {
      const titulo = this.obterTituloGrupo(pedido);
      const pedidos = grupos.get(titulo) || [];

      pedidos.push(pedido);
      grupos.set(titulo, pedidos);
    });

    return Array.from(grupos.entries()).map(([titulo, pedidos]) => ({ titulo, pedidos }));
  }

  get anosDisponiveis(): string[] {
    const anos = new Set<number>();

    this.pedidos.forEach((pedido) => anos.add(this.obterAnoPedido(pedido)));

    return ['Todos', ...Array.from(anos).sort((a, b) => b - a).map((ano) => String(ano))];
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

  selecionarAno(ano: string) {
    this.anoSelecionado = ano;
  }

  limparFiltros() {
    this.mesSelecionado = 'Todos';
    this.anoSelecionado = 'Todos';
  }

  aplicarFiltros() {
    this.filtrosAberto = false;
  }

  private pedidoEstaAcontecerAgora(pedido: Pedido): boolean {
    if (pedido.estado === 'Cancelado' || pedido.estadoManual === 'Cancelado') {
      return false;
    }

    const estado = this.estadoAtualPedido(pedido);

    return estado === 'Recebido' || estado === 'A preparar' || estado === 'A caminho';
  }

  private sincronizarEstadoPedido(pedido: Pedido): Pedido {
    if (pedido.estadoManual === 'Cancelado' || pedido.estadoManual === 'Entregue') {
      return pedido;
    }

    const estado = this.estadoAtualPedido(pedido);

    if (estado === pedido.estado) {
      return pedido;
    }

    const pedidoAtualizado = {
      ...pedido,
      estado,
      estadoManual: undefined
    };

    this.pedidosService.atualizarPedido(pedidoAtualizado);

    return pedidoAtualizado;
  }

  private iniciarTemporizador() {
    this.pararTemporizador();
    this.temporizador = setInterval(() => {
      this.agora = new Date();
    }, 1000);
  }

  private pararTemporizador() {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }

  private async iniciarRealtimePedidos() {
    if (!this.supabaseService.enabled || this.pedidosRealtimeUnsubscribe) {
      return;
    }

    this.pedidosRealtimeUnsubscribe = await this.supabaseService.subscribeToCurrentUserOrders(() => {
      void this.carregarPedidos();
    });
  }

  private pararRealtimePedidos() {
    this.pedidosRealtimeUnsubscribe?.();
    this.pedidosRealtimeUnsubscribe = null;
  }

  private obterTituloGrupo(pedido: Pedido): string {
    const data = this.extrairDataPedido(pedido.dataIso || pedido.data);

    if (!data) {
      return `${this.mesesTitulos[new Date().getMonth()]} DE ${new Date().getFullYear()}`;
    }

    const ano = this.obterAnoPedido(pedido);

    return `${this.mesesTitulos[data.mes - 1]} DE ${ano}`;
  }

  private obterAnoPedido(pedido: Pedido): number {
    const dataIso = this.extrairDataIsoPedido(pedido);

    if (dataIso) {
      return dataIso.getFullYear();
    }

    if (pedido.data.toLowerCase().includes('hoje') || pedido.data.toLowerCase().includes('ontem')) {
      return new Date().getFullYear();
    }

    return this.anosPorPedido[pedido.id.replace('-A', '')] || new Date().getFullYear();
  }

  private extrairDataPedido(valor: string): { dia: number; mes: number } | null {
    const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (iso) {
      return {
        dia: Number(iso[3]),
        mes: Number(iso[2])
      };
    }

    if (valor.toLowerCase().includes('hoje') || valor.toLowerCase().includes('ontem')) {
      const dataAtual = new Date();
      return {
        dia: dataAtual.getDate(),
        mes: dataAtual.getMonth() + 1
      };
    }

    const match = valor.match(/(\d{2})\/(\d{2})/);

    if (!match) {
      return null;
    }

    return {
      dia: Number(match[1]),
      mes: Number(match[2])
    };
  }

  private extrairDataIsoPedido(pedido: Pedido): Date | null {
    const valor = pedido.dataIso || pedido.data;
    const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!iso) {
      return null;
    }

    const data = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
    return Number.isNaN(data.getTime()) ? null : data;
  }
}
