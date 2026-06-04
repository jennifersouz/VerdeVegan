import { Component, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  MetodoPagamento,
  MoradaEntrega,
  PerfilService,
  UtilizadorPerfil
} from '../../services/perfil';
import { CarrinhoService, ItemCarrinho } from '../../services/carrinho';
import { Pedidos } from '../../services/pedidos';

interface PedidoConfirmado {
  id: string;
  nome: string;
  data: string;
  hora: string;
}

interface PassoCheckout {
  numero: number;
  label: string;
}

interface NovoCartao {
  titular: string;
  numero: string;
  validade: string;
  cvv: string;
  tipo: 'Visa' | 'Mastercard' | 'MB Way';
}

@Component({
  selector: 'app-carrinho',
  templateUrl: './carrinho.page.html',
  styleUrls: ['./carrinho.page.scss'],
  standalone: false
})
export class CarrinhoPage implements OnDestroy {

  // ── Estado geral ────────────────────────────────────────────────────────────
  carregando = true;
  estaLogado = false;
  modalLoginAberto = false;

  // ── Itens ───────────────────────────────────────────────────────────────────
  itens: ItemCarrinho[] = [];

  // ── Checkout ────────────────────────────────────────────────────────────────
  taxaEntrega = 2.4;
  passoAtual = 1;
  pontosDisponiveis = 0;
  pontosUsados = 0;
  codigoDesconto = '';
  codigoAplicado = false;
  descontoCodigo = 0;

  moradas: MoradaEntrega[] = [];
  moradaSelecionadaId = 0;
  modalMoradaAberto = false;
  novaMorada = {
    titulo: '',
    rua: '',
    numero: '',
    codigoPostal: '',
    cidade: '',
    localidade: ''
  };

  metodosPagamento: MetodoPagamento[] = [];
  metodoSelecionado = 'cartao';
  pagamentoEntrega = '';
  cartaoSelecionadoId = 0;
  telefonePagamento = '';
  modalCartoesAberto = false;
  modoNovoCartao = false;
  novoCartao: NovoCartao = {
    titular: '',
    numero: '',
    validade: '',
    cvv: '',
    tipo: 'Mastercard'
  };

  pedidoConfirmado?: PedidoConfirmado;
  segundosParaInicio = 5;
  confirmandoPedido = false;

  readonly passos: PassoCheckout[] = [
    { numero: 1, label: 'Carrinho' },
    { numero: 2, label: 'Descontos' },
    { numero: 3, label: 'Morada' },
    { numero: 4, label: 'Pagamento' },
    { numero: 5, label: 'Confirmação' }
  ];

  private perfilAtual: UtilizadorPerfil | null = null;
  private temporizadorConfirmacao?: ReturnType<typeof setInterval>;

  constructor(
    private perfilService: PerfilService,
    private carrinhoService: CarrinhoService,
    private pedidosService: Pedidos,
    private router: Router,
    private ngZone: NgZone
  ) {}

  // ── Ciclo de vida ────────────────────────────────────────────────────────────
  ionViewWillEnter() {
    this.limparTemporizadorConfirmacao();
    this.passoAtual = 1;
    this.pedidoConfirmado = undefined;
    this.confirmandoPedido = false;
    this.carregarCarrinho();
  }

  ionViewWillLeave() {
    this.limparTemporizadorConfirmacao();
  }

  ngOnDestroy() {
    this.limparTemporizadorConfirmacao();
  }

  // ── Carregar dados ───────────────────────────────────────────────────────────
  async carregarCarrinho() {
    this.carregando = true;

    try {
      this.itens = await this.carrinhoService.obterItens();

      const perfil = await this.perfilService.obterPerfil();
      this.perfilAtual = perfil;
      this.estaLogado = !!perfil;

      if (perfil) {
        this.pontosDisponiveis = perfil.pontos || 0;
        this.telefonePagamento = perfil.telefone || '';
        this.moradas = await this.perfilService.obterMoradas();
        this.metodosPagamento = await this.perfilService.obterMetodosPagamento();
        this.moradaSelecionadaId = this.moradas.find(m => m.principal)?.id || this.moradas[0]?.id || 0;
        this.cartaoSelecionadoId = this.metodosPagamento.find(m => m.principal)?.id || this.metodosPagamento[0]?.id || 0;
      }
    } catch (erro) {
      console.error('Erro ao carregar carrinho:', erro);
    } finally {
      this.carregando = false;
    }
  }

  // ── Getters ──────────────────────────────────────────────────────────────────
  get subtotal() {
    return this.itens.reduce((total, item) => total + item.totalFinal, 0);
  }

  get totalAntesDesconto() {
    return this.subtotal + this.taxaEntrega;
  }

  get descontoPontos() {
    return this.pontosUsados / 10;
  }

  get descontoTotal() {
    return this.descontoPontos + this.descontoCodigo;
  }

  get total() {
    return Math.max(this.totalAntesDesconto - this.descontoTotal, 0);
  }

  get maximoPontosUsaveis() {
    return Math.min(this.pontosDisponiveis, Math.floor(this.totalAntesDesconto * 10));
  }

  get moradaSelecionada() {
    return this.moradas.find(m => m.id === this.moradaSelecionadaId);
  }

  get cartaoSelecionado() {
    return this.metodosPagamento.find(m => m.id === this.cartaoSelecionadoId);
  }

  get pagamentoResumo() {
    if (this.metodoSelecionado === 'cartao' && this.cartaoSelecionado) {
      return `${this.cartaoSelecionado.tipo} terminado em ${this.cartaoSelecionado.ultimosDigitos}`;
    }
    if (this.metodoSelecionado === 'dinheiro') {
      return this.pagamentoEntrega ? `Dinheiro · ${this.pagamentoEntrega}` : 'Dinheiro';
    }
    if (this.metodoSelecionado === 'applepay') return 'Apple Pay';
    return 'MB WAY';
  }

  // ── Gerir itens ──────────────────────────────────────────────────────────────
  async removerItem(id: number) {
    await this.carrinhoService.removerItem(id);
    this.itens = await this.carrinhoService.obterItens();
    this.validarPontosUsados();
  }

  async diminuirQuantidade(id: number) {
    const item = this.itens.find(i => i.id === id);
    if (!item || item.quantidade <= 1) return;
    await this.carrinhoService.atualizarQuantidade(id, item.quantidade - 1);
    this.itens = await this.carrinhoService.obterItens();
    this.validarPontosUsados();
  }

  async aumentarQuantidade(id: number) {
    const item = this.itens.find(i => i.id === id);
    if (!item) return;
    await this.carrinhoService.atualizarQuantidade(id, item.quantidade + 1);
    this.itens = await this.carrinhoService.obterItens();
    this.validarPontosUsados();
  }

  // ── Navegação por passos ─────────────────────────────────────────────────────
  async continuar() {
    this.desfocarElementoAtivo();

    // Passo 1 → verificar autenticação
    if (this.passoAtual === 1) {
      const emailAtual = await this.perfilService.obterEmailUtilizadorAtual();

      if (!emailAtual) {
        this.modalLoginAberto = true;
        return;
      }

      // Recarregar dados do perfil caso acabou de fazer login
      const perfil = await this.perfilService.obterPerfil();
      this.perfilAtual = perfil;
      this.estaLogado = !!perfil;

      if (perfil) {
        this.pontosDisponiveis = perfil.pontos || 0;
        this.telefonePagamento = perfil.telefone || '';
        this.moradas = await this.perfilService.obterMoradas();
        this.metodosPagamento = await this.perfilService.obterMetodosPagamento();
        this.moradaSelecionadaId = this.moradas.find(m => m.principal)?.id || this.moradas[0]?.id || 0;
        this.cartaoSelecionadoId = this.metodosPagamento.find(m => m.principal)?.id || this.metodosPagamento[0]?.id || 0;
      }
    }

    if (this.passoAtual === 2) {
      this.validarPontosUsados();
    }

    if (this.passoAtual === 3 && !this.moradaSelecionadaId) {
      return;
    }

    if (this.passoAtual === 4 && !this.pagamentoValido()) {
      return;
    }

    if (this.passoAtual < 5) {
      this.passoAtual++;
    }
  }

  voltarPasso() {
    this.desfocarElementoAtivo();

    if (this.passoAtual > 1 && this.passoAtual < 5) {
      this.passoAtual--;
    }
  }

  irParaPasso(passo: number) {
    if (passo < this.passoAtual && this.passoAtual < 5) {
      this.passoAtual = passo;
    }
  }

  passoConcluido(numero: number) {
    return numero < this.passoAtual;
  }

  obterNomeEtapaAtual(): string {
    const passo = this.passos.find(etapa => etapa.numero === this.passoAtual);
    return passo ? passo.label : '';
  }

  // ── Descontos e pontos ───────────────────────────────────────────────────────
  aplicarCodigo() {
    const codigo = this.codigoDesconto.trim().toUpperCase();
    this.codigoAplicado = codigo.length > 0;
    this.descontoCodigo = this.codigoAplicado ? Math.min(2, this.totalAntesDesconto) : 0;
    this.validarPontosUsados();
  }

  usarTodosPontos() {
    this.pontosUsados = this.maximoPontosUsaveis;
  }

  validarPontosUsados() {
    const pontos = Number(this.pontosUsados) || 0;
    this.pontosUsados = Math.max(0, Math.min(Math.floor(pontos), this.maximoPontosUsaveis));
  }

  // ── Moradas ──────────────────────────────────────────────────────────────────
  selecionarMorada(id: number) {
    this.moradaSelecionadaId = id;
  }

  abrirModalMorada() {
    this.novaMorada = { titulo: '', rua: '', numero: '', codigoPostal: '', cidade: '', localidade: '' };
    this.modalMoradaAberto = true;
  }

  fecharModalMorada() {
    this.modalMoradaAberto = false;
  }

  async guardarMorada() {
    if (!this.novaMorada.titulo || !this.novaMorada.rua || !this.novaMorada.codigoPostal || !this.novaMorada.cidade) {
      return;
    }

    const morada: MoradaEntrega = {
      id: Date.now(),
      titulo: this.novaMorada.titulo,
      rua: `${this.novaMorada.rua}${this.novaMorada.numero ? `, ${this.novaMorada.numero}` : ''}`,
      codigoPostal: this.novaMorada.codigoPostal,
      cidade: this.novaMorada.cidade,
      principal: this.moradas.length === 0
    };

    await this.perfilService.adicionarMorada(morada);
    this.moradas = await this.perfilService.obterMoradas();
    this.moradaSelecionadaId = morada.id;
    this.fecharModalMorada();
  }

  // ── Pagamentos ───────────────────────────────────────────────────────────────
  selecionarMetodo(metodo: string) {
    this.metodoSelecionado = metodo;
    this.filtrarTelefonePagamento();
  }

  selecionarPagamentoEntrega(tipo: string) {
    this.pagamentoEntrega = tipo;
  }

  abrirModalCartoes() {
    this.modoNovoCartao = false;
    this.modalCartoesAberto = true;
  }

  fecharModalCartoes() {
    this.modalCartoesAberto = false;
  }

  mostrarNovoCartao() {
    this.modoNovoCartao = true;
    this.novoCartao = { titular: '', numero: '', validade: '', cvv: '', tipo: 'Mastercard' };
  }

  voltarAosCartoes() {
    this.modoNovoCartao = false;
  }

  selecionarCartao(id: number) {
    this.cartaoSelecionadoId = id;
    this.fecharModalCartoes();
  }

  async guardarCartao() {
    const ultimosDigitos = this.novoCartao.numero.replace(/\s/g, '').slice(-4);
    if (!this.novoCartao.titular || ultimosDigitos.length < 4 || !this.novoCartao.validade) return;

    const pagamento: MetodoPagamento = {
      id: Date.now(),
      tipo: this.novoCartao.tipo,
      titular: this.novoCartao.titular,
      ultimosDigitos,
      validade: this.novoCartao.validade,
      principal: this.metodosPagamento.length === 0
    };

    await this.perfilService.adicionarMetodoPagamento(pagamento);
    this.metodosPagamento = await this.perfilService.obterMetodosPagamento();
    this.cartaoSelecionadoId = pagamento.id;
    this.modoNovoCartao = false;
    this.fecharModalCartoes();
  }

  pagamentoValido(): boolean {
    if (this.metodoSelecionado === 'cartao') return !!this.cartaoSelecionadoId;
    if (this.metodoSelecionado === 'mbway' || this.metodoSelecionado === 'applepay') {
      return /^9[1236]\d{7}$/.test(this.telefonePagamento);
    }
    if (this.metodoSelecionado === 'dinheiro') return !!this.pagamentoEntrega;
    return true;
  }

  filtrarTelefonePagamento() {
    this.telefonePagamento = this.telefonePagamento.replace(/\D/g, '').slice(0, 9);
  }

  // ── Confirmar pedido ─────────────────────────────────────────────────────────
  async confirmarPedido() {
    if (this.confirmandoPedido || !this.pagamentoValido() || !this.moradaSelecionada) return;

    this.confirmandoPedido = true;
    this.desfocarElementoAtivo();

    const agora = new Date();
    const criadoEm = Date.now();
    const pedidoSimples = {
      id: '#VV-' + Math.floor(1000 + Math.random() * 9000),
      nome: this.itens[0]?.prato?.nome || 'Pedido VerdeVegan',
      data: 'Hoje',
      hora: agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      itens: this.itens.reduce((total, item) => total + item.quantidade, 0),
      estado: 'Recebido',
      total: this.total,
      pagamento: this.pagamentoResumo,
      morada: this.moradaSelecionada.titulo
    };

    // Converter itens do carrinho para ItemPedido[]
    const itensPedido = this.itens.map(item => ({
      nome: item.prato?.nome || 'Produto',
      quantidade: item.quantidade,
      preco: item.totalUnidade
    }));

    const quantidadeTotal = itensPedido.reduce((t, i) => t + i.quantidade, 0);
    const estimativaEntregaMinutos = quantidadeTotal <= 1 ? 25 : quantidadeTotal <= 3 ? 35 : 45;

    const pedidoCompleto = {
      id: Date.now(),
      codigo: pedidoSimples.id,
      nome: pedidoSimples.nome,
      data: pedidoSimples.data,
      hora: pedidoSimples.hora,
      estado: 'Recebido' as const,
      restaurante: this.itens[0]?.prato?.restaurante || 'VerdeVegan',
      morada: this.moradaSelecionada.titulo,
      pagamento: this.pagamentoResumo,
      metodoPagamento: this.pagamentoResumo,
      pontosGanhos: Math.floor(this.total) * 10,
      subtotal: this.subtotal,
      total: this.total,
      taxaEntrega: this.taxaEntrega,
      desconto: this.descontoTotal,
      criadoEm,
      cancelavelAte: criadoEm + 45000,
      estimativaEntregaMinutos,
      estimativaEntregaEm: criadoEm + estimativaEntregaMinutos * 60 * 1000,
      itens: itensPedido
    };

    try {
      const pedidoCriado = await this.pedidosService.adicionarPedido(pedidoCompleto);
      await this.atualizarPontosDepoisPedido();
      await this.carrinhoService.limparCarrinho();
      this.itens = [];
      await this.router.navigateByUrl(`/tabs/detalhe-pedido/${pedidoCriado.id}`, { replaceUrl: true });
    } finally {
      this.confirmandoPedido = false;
    }
  }

  // ── Modal de login ───────────────────────────────────────────────────────────
  fecharModalLogin() {
    this.modalLoginAberto = false;
  }

  irParaLogin() {
    this.fecharModalLogin();
    this.desfocarElementoAtivo();
    this.router.navigateByUrl('/login?returnUrl=/tabs/carrinho');
  }

  irParaRegisto() {
    this.fecharModalLogin();
    this.desfocarElementoAtivo();
    this.router.navigateByUrl('/registo?returnUrl=/tabs/carrinho');
  }

  verMenu() {
    this.desfocarElementoAtivo();
    this.router.navigateByUrl('/tabs/menu');
  }

  irParaInicio() {
    this.limparTemporizadorConfirmacao();
    this.desfocarElementoAtivo();
    this.ngZone.run(() => {
      this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    });
  }

  // ── Formatação ───────────────────────────────────────────────────────────────
  formatarPreco(valor: number): string {
    return `${valor.toFixed(2).replace('.', ',')} €`;
  }

  obterNomeItem(item: ItemCarrinho): string {
    return item.prato?.nome || 'Produto';
  }

  obterPrecoItem(item: ItemCarrinho): number {
    return item.totalFinal;
  }

  // ── Auxiliares privadas ──────────────────────────────────────────────────────
  private async atualizarPontosDepoisPedido() {
    if (!this.perfilAtual) return;

    const pontosGanhos = Math.floor(this.total) * 10;
    const perfilAtualizado: UtilizadorPerfil = {
      ...this.perfilAtual,
      pontos: Math.max(0, (this.perfilAtual.pontos || 0) - this.pontosUsados) + pontosGanhos
    };

    await this.perfilService.atualizarPerfil(perfilAtualizado);
    this.perfilAtual = perfilAtualizado;
    this.pontosDisponiveis = perfilAtualizado.pontos;
  }

  private iniciarContadorInicio() {
    this.segundosParaInicio = 5;
    this.limparTemporizadorConfirmacao();

    this.temporizadorConfirmacao = setInterval(() => {
      this.ngZone.run(() => {
        this.segundosParaInicio = Math.max(0, this.segundosParaInicio - 1);
        if (this.segundosParaInicio <= 0) {
          this.irParaInicio();
        }
      });
    }, 1000);
  }

  private limparTemporizadorConfirmacao() {
    if (this.temporizadorConfirmacao) {
      clearInterval(this.temporizadorConfirmacao);
      this.temporizadorConfirmacao = undefined;
    }
  }

  private desfocarElementoAtivo() {
    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }
}
