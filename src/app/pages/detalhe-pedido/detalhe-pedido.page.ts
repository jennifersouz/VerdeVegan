import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArtigoPedido, Pedido, Pedidos } from 'src/app/services/pedidos';
import { PerfilService } from 'src/app/services/perfil';
import { Carrinho } from 'src/app/services/carrinho';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-detalhe-pedido',
  templateUrl: './detalhe-pedido.page.html',
  styleUrls: ['./detalhe-pedido.page.scss'],
  standalone: false
})
export class DetalhePedidoPage {
  pedido?: Pedido;
  carregando = true;
  pedidoNaoEncontrado = false;
  saldoPontos = 0;
  reviewAberta = false;
  avaliacao = 0;
  comentarioAvaliacao = '';
  estrelas = [1, 2, 3, 4, 5];
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidosService: Pedidos,
    private perfilService: PerfilService,
    private carrinhoService: Carrinho,
    private supabaseService: SupabaseService
  ) { }

  ionViewWillEnter() {
    this.carregarPedido();
  }

  async carregarPedido() {
    this.carregando = true;
    this.pedidoNaoEncontrado = false;

    const perfil = await this.perfilService.obterPerfil();
    const id = this.route.snapshot.paramMap.get('id');

    this.saldoPontos = perfil?.pontos || 0;
    const pedidos = await this.carregarPedidosDisponiveis(perfil?.email);
    this.pedido = id ? this.encontrarPedidoPorId(pedidos, id) : pedidos[0];

    if (
      this.pedido &&
      this.pedido.estadoManual !== 'Cancelado' &&
      this.pedido.estadoManual !== 'Entregue'
    ) {
      const estado = this.pedidosService.obterEstadoAtual(this.pedido);

      if (estado !== this.pedido.estado) {
        this.pedido = {
          ...this.pedido,
          estado,
          estadoManual: undefined
        };
        this.pedidosService.atualizarPedido(this.pedido);
        await this.supabaseService.atualizarEstadoPedido(this.pedido.id, estado);

        if (estado === 'Entregue' && this.pedido.pontosGanhos) {
          await this.perfilService.adicionarPontosPedido(
            'Acumulaste',
            this.pedido.pontosGanhos,
            this.pedido.id,
            'pontos_entrega'
          );
        }
      }
    }

    this.pedidoNaoEncontrado = !this.pedido;
    this.carregando = false;
  }

  get artigos(): ArtigoPedido[] {
    if (!this.pedido) {
      return [];
    }

    if (this.pedido.artigos?.length) {
      return this.pedido.artigos;
    }

    return [
      {
        nome: this.pedido.nome,
        quantidade: this.pedido.itens,
        preco: this.subtotal
      }
    ];
  }

  get taxaEntrega(): number {
    return this.pedido?.taxaEntrega ?? 3.4;
  }

  get subtotal(): number {
    if (!this.pedido) {
      return 0;
    }

    if (this.pedido.artigos?.length) {
      return this.pedido.artigos.reduce((total, artigo) => total + artigo.preco, 0);
    }

    return Math.max(0, this.pedido.total - this.taxaEntrega);
  }

  get dataPedido(): string {
    if (!this.pedido) {
      return '';
    }

    if (this.pedido.data.toLowerCase() === 'hoje') {
      return new Date().toISOString().slice(0, 10);
    }

    const match = this.pedido.data.match(/(\d{2})\/(\d{2})/);

    if (!match) {
      return this.pedido.data;
    }

    const ano = this.anosPorPedido[this.pedido.id.replace('-A', '')] || new Date().getFullYear();

    return `${ano}-${match[2]}-${match[1]}`;
  }

  get pontosGanhos(): number {
    return this.pedido?.pontosGanhos ?? Math.floor(this.pedido?.total || 0);
  }

  get saldoAtual(): number {
    return this.pedido?.saldoPontos ?? this.saldoPontos;
  }

  get podeAcompanharPedido(): boolean {
    if (!this.pedido) {
      return false;
    }

    return this.estadoAtual !== 'Entregue' && this.estadoAtual !== 'Cancelado';
  }

  get podeDarReview(): boolean {
    return this.estadoAtual === 'Entregue';
  }

  get textoBotaoReview(): string {
    return this.pedido?.avaliado ? 'Alterar review' : 'Dar review ao pedido';
  }

  get estadoAtual(): string {
    return this.pedido ? this.pedidosService.obterEstadoAtual(this.pedido) : '';
  }

  formatarMoeda(valor: number): string {
    return `${valor.toFixed(2).replace('.', ',')} €`;
  }

  voltarPedidos() {
    this.router.navigateByUrl('/tabs/pedidos');
  }

  acompanharPedido() {
    if (!this.pedido) {
      return;
    }

    this.router.navigate(['/tabs/acompanhar-pedido', this.pedido.id.replace('#', '')]);
  }

  abrirReview() {
    if (!this.pedido) {
      return;
    }

    this.avaliacao = this.pedido.avaliacao || 0;
    this.comentarioAvaliacao = this.pedido.comentarioAvaliacao || '';
    this.reviewAberta = true;
  }

  fecharReview() {
    this.reviewAberta = false;
  }

  preenchimentoEstrela(estrela: number): number {
    const valor = Math.max(0, Math.min(1, this.avaliacao - (estrela - 1)));

    return valor >= 1 ? 100 : valor >= 0.5 ? 50 : 0;
  }

  selecionarAvaliacao(event: MouseEvent, estrela: number) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const metade = event.clientX - rect.left <= rect.width / 2 ? 0.5 : 1;

    this.avaliacao = estrela - 1 + metade;
  }

  guardarReview() {
    if (!this.pedido) {
      return;
    }

    this.pedido = {
      ...this.pedido,
      avaliado: true,
      avaliacao: this.avaliacao,
      comentarioAvaliacao: this.comentarioAvaliacao.trim()
    };
    this.pedidosService.atualizarPedido(this.pedido);
    this.fecharReview();
  }

  async repetirPedido() {
    if (!this.pedido) {
      return;
    }

    const perfil = await this.perfilService.obterPerfil();
    const itensAtuais = this.carrinhoService.obterItens(perfil?.email);
    const itensPedido = this.artigos.map((artigo) => ({
      nome: artigo.nome,
      quantidade: artigo.quantidade,
      preco: artigo.preco / artigo.quantidade
    }));

    this.carrinhoService.guardarItens([...itensAtuais, ...itensPedido], perfil?.email);
    this.router.navigateByUrl('/tabs/carrinho');
  }

  private async carregarPedidosDisponiveis(email?: string): Promise<Pedido[]> {
    if (this.supabaseService.enabled) {
      const pedidosRemotos = await this.supabaseService.listarPedidos();

      if (pedidosRemotos.data?.length) {
        return pedidosRemotos.data;
      }
    }

    return email ? this.pedidosService.obterPedidos(email) : this.pedidosService.obterPedidos();
  }

  private encontrarPedidoPorId(pedidos: Pedido[], id: string): Pedido | undefined {
    const idNormalizado = this.pedidosService.normalizarIdPedido(id);

    return pedidos.find((pedido) =>
      this.pedidosService.normalizarIdPedido(pedido.id) === idNormalizado
    );
  }
}
