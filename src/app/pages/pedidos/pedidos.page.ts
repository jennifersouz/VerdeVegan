import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Pedido, Pedidos } from 'src/app/services/pedidos';
import { CarrinhoService } from 'src/app/services/carrinho';
import { PerfilService } from 'src/app/services/perfil';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage implements OnDestroy {

  pedidos: Pedido[] = [];
  pesquisa = '';
  estadoSelecionado = 'Todos';
  estados = ['Todos', 'Entregues', 'A caminho', 'A preparar', 'Recebidos', 'Cancelados'];
  estaLogado = false;
  filtrosAberto = false;
  mesSelecionado = 'Todos';
  anoSelecionado = 'Todos';

  meses = [
    'Todos', 'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  private intervaloEstados: ReturnType<typeof setInterval> | null = null;

  constructor(
    private pedidosService: Pedidos,
    private carrinhoService: CarrinhoService,
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.carregarPedidos();
    this.iniciarAtualizacaoEstados();
  }

  ionViewWillLeave() {
    this.pararAtualizacaoEstados();
  }

  ngOnDestroy() {
    this.pararAtualizacaoEstados();
  }

  async carregarPedidos() {
    const perfil = await this.perfilService.obterPerfil();
    this.estaLogado = !!perfil;
    this.pedidos = await this.pedidosService.obterPedidos();
  }

  // ── Interval leve — só substitui this.pedidos se algum estado mudou ──────
  private iniciarAtualizacaoEstados() {
    this.pararAtualizacaoEstados();

    this.intervaloEstados = setInterval(async () => {
      const atualizados = await this.pedidosService.obterPedidos();

      // Verificar se há pedidos activos (não terminais) — se não houver, parar
      const temAtivos = atualizados.some(
        p => p.estado !== 'Entregue' && p.estado !== 'Cancelado'
      );
      if (!temAtivos) {
        // Actualizar uma última vez para reflectir estados finais e parar
        this.pedidos = atualizados;
        this.pararAtualizacaoEstados();
        return;
      }

      // Só substitui se houve pelo menos uma mudança de estado
      const houveMudanca = atualizados.some(atualizado => {
        const atual = this.pedidos.find(p => p.id === atualizado.id);
        return atual && atual.estado !== atualizado.estado;
      });

      if (houveMudanca) {
        this.pedidos = atualizados;
      }
    }, 1000);
  }

  private pararAtualizacaoEstados() {
    if (this.intervaloEstados) {
      clearInterval(this.intervaloEstados);
      this.intervaloEstados = null;
    }
  }

  // ── Navegar para o detalhe ────────────────────────────────────────────────
  public abrirPedido(id: number) {
    this.router.navigateByUrl(`/tabs/detalhe-pedido/${id}`);
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  get pedidosFiltrados(): Pedido[] {
    const pesquisa = this.pesquisa.trim().toLowerCase();

    return this.pedidos.filter((pedido: Pedido) => {
      const correspondePesquisa =
        !pesquisa ||
        pedido.nome.toLowerCase().includes(pesquisa) ||
        pedido.morada.toLowerCase().includes(pesquisa) ||
        pedido.metodoPagamento.toLowerCase().includes(pesquisa);

      const correspondeEstado = (() => {
        if (this.estadoSelecionado === 'Todos') return true;
        if (this.estadoSelecionado === 'Entregues')   return pedido.estado === 'Entregue';
        if (this.estadoSelecionado === 'A caminho')   return pedido.estado === 'A caminho';
        if (this.estadoSelecionado === 'A preparar') return pedido.estado === 'A preparar';
        if (this.estadoSelecionado === 'Recebidos')  return pedido.estado === 'Recebido';
        if (this.estadoSelecionado === 'Cancelados')  return pedido.estado === 'Cancelado';
        return true;
      })();

      return correspondePesquisa && correspondeEstado;
    });
  }

  selecionarEstado(estado: string) {
    this.estadoSelecionado = estado;
  }

  abrirFiltros()  { this.filtrosAberto = true;  }
  fecharFiltros() { this.filtrosAberto = false; }

  selecionarMes(mes: string) { this.mesSelecionado = mes; }

  limparFiltros() {
    this.mesSelecionado = 'Todos';
    this.anoSelecionado = 'Todos';
  }

  aplicarFiltros() { this.filtrosAberto = false; }

  // ── Cor do badge de estado ────────────────────────────────────────────────
  public obterCorEstado(estado: string): string {
    const mapa: Record<string, string> = {
      'Recebido':    '#f59e0b',
      'A preparar':  '#3b82f6',
      'A caminho':   '#8b5cf6',
      'Entregue':    '#22c55e',
      'Cancelado':   '#ef4444'
    };
    return mapa[estado] || '#6b7280';
  }

  public obterNumeroItens(pedido: Pedido): number {
    return pedido.itens?.reduce((sum, item) => sum + item.quantidade, 0)
      ?? 0;
  }

  public podeRepetirPedido(pedido: Pedido): boolean {
    return pedido.estado === 'Entregue' || pedido.estado === 'Cancelado';
  }

  public async repetirPedido(pedido: Pedido, event?: Event) {
    event?.stopPropagation();

    for (const item of pedido.itens) {
      const idBase = Date.now() + Math.floor(Math.random() * 1000);
      await this.carrinhoService.adicionarItem({
        id: idBase,
        prato: {
          id: idBase,
          nome: item.nome,
          tipo: 'Refeições',
          categoria: 'Pedido anterior',
          restaurante: pedido.restaurante,
          descricao: 'Item repetido a partir do histórico de pedidos.',
          preco: item.preco,
          avaliacao: 5,
          tempo: '25-35 min',
          imagem: '',
          destaque: false,
          personalizavel: false
        },
        quantidade: item.quantidade,
        selecoes: {},
        observacoes: '',
        totalUnidade: item.preco,
        totalFinal: item.preco * item.quantidade
      });
    }

    this.router.navigateByUrl('/tabs/carrinho');
  }
}
