import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  MetodoPagamento,
  MoradaEntrega,
  PerfilService,
  UtilizadorPerfil
} from '../../services/perfil';
import { Pedido, Pedidos } from '../../services/pedidos';

interface ItemCarrinho {
  nome: string;
  quantidade: number;
  preco: number;
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
  estaLogado = false;
  modalLoginAberto = false;

  itens: ItemCarrinho[] = [];

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

  pedidoConfirmado?: Pedido;
  segundosParaInicio = 5;

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
    private pedidosService: Pedidos,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.limparTemporizadorConfirmacao();
    this.passoAtual = 1;
    this.atualizarSessao();
  }

  ngOnDestroy() {
    this.limparTemporizadorConfirmacao();
  }

  private async atualizarSessao() {
    const perfil = await this.perfilService.obterPerfil();
    this.perfilAtual = perfil;
    this.estaLogado = !!perfil;

    if (!perfil) {
      this.itens = this.obterCarrinhoAnonimo();
      return;
    }

    this.itens = this.obterCarrinhoGuardado(perfil);
    this.pontosDisponiveis = perfil.pontos || 0;
    this.telefonePagamento = perfil.telefone || '';
    this.moradas = await this.perfilService.obterMoradas();
    this.metodosPagamento = await this.perfilService.obterMetodosPagamento();
    this.moradaSelecionadaId = this.moradas.find((morada) => morada.principal)?.id || this.moradas[0]?.id || 0;
    this.cartaoSelecionadoId = this.metodosPagamento.find((metodo) => metodo.principal)?.id || this.metodosPagamento[0]?.id || 0;
  }

  get subtotal() {
    return this.itens.reduce((total, item) => {
      return total + item.preco * item.quantidade;
    }, 0);
  }

  get total() {
    return Math.max(this.totalAntesDesconto - this.descontoTotal, 0);
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

  get maximoPontosUsaveis() {
    return Math.min(this.pontosDisponiveis, Math.floor(this.totalAntesDesconto * 10));
  }

  get moradaSelecionada() {
    return this.moradas.find((morada) => morada.id === this.moradaSelecionadaId);
  }

  get cartaoSelecionado() {
    return this.metodosPagamento.find((metodo) => metodo.id === this.cartaoSelecionadoId);
  }

  get pagamentoResumo() {
    if (this.metodoSelecionado === 'cartao' && this.cartaoSelecionado) {
      return `${this.cartaoSelecionado.tipo} terminado em ${this.cartaoSelecionado.ultimosDigitos}`;
    }

    if (this.metodoSelecionado === 'dinheiro') {
      return this.pagamentoEntrega ? `Dinheiro · ${this.pagamentoEntrega}` : 'Dinheiro';
    }

    if (this.metodoSelecionado === 'applepay') {
      return 'Apple Pay';
    }

    return 'MB WAY';
  }

  removerItem(index: number) {
    this.itens.splice(index, 1);
    this.guardarCarrinhoAtual();
    this.validarPontosUsados();
  }

  diminuirQuantidade(index: number) {
    if (this.itens[index].quantidade <= 1) {
      return;
    }

    this.itens[index].quantidade--;
    this.guardarCarrinhoAtual();
    this.validarPontosUsados();
  }

  aumentarQuantidade(index: number) {
    this.itens[index].quantidade++;
    this.guardarCarrinhoAtual();
    this.validarPontosUsados();
  }

  async continuar() {
    const perfil = await this.perfilService.obterPerfil();

    if (!perfil) {
      this.modalLoginAberto = true;
      return;
    }

    this.perfilAtual = perfil;
    this.estaLogado = true;

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

  selecionarMorada(id: number) {
    this.moradaSelecionadaId = id;
  }

  abrirModalMorada() {
    this.novaMorada = {
      titulo: '',
      rua: '',
      numero: '',
      codigoPostal: '',
      cidade: '',
      localidade: ''
    };
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

  selecionarMetodo(metodo: string) {
    this.metodoSelecionado = metodo;
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
    this.novoCartao = {
      titular: '',
      numero: '',
      validade: '',
      cvv: '',
      tipo: 'Mastercard'
    };
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

    if (!this.novoCartao.titular || ultimosDigitos.length < 4 || !this.novoCartao.validade) {
      return;
    }

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

  pagamentoValido() {
    if (this.metodoSelecionado === 'cartao') {
      return !!this.cartaoSelecionadoId;
    }

    if (this.metodoSelecionado === 'mbway' || this.metodoSelecionado === 'applepay') {
      return this.telefonePagamento.trim().length >= 9;
    }

    if (this.metodoSelecionado === 'dinheiro') {
      return !!this.pagamentoEntrega;
    }

    return true;
  }

  async confirmarPedido() {
    if (!this.pagamentoValido() || !this.moradaSelecionada) {
      return;
    }

    const agora = new Date();
    const pedido: Pedido = {
      id: '#VV-' + Math.floor(1000 + Math.random() * 9000),
      nome: this.itens[0]?.nome || 'Pedido VerdeVegan',
      data: 'Hoje',
      hora: agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      itens: this.itens.reduce((total, item) => total + item.quantidade, 0),
      estado: 'A preparar',
      total: this.total,
      pagamento: this.pagamentoResumo,
      morada: this.moradaSelecionada.titulo
    };

    this.pedidosService.adicionarPedido(pedido);
    await this.atualizarPontosDepoisPedido();
    this.itens = [];
    await this.guardarCarrinhoAtual();
    this.pedidoConfirmado = pedido;
    this.passoAtual = 5;
    this.iniciarContadorInicio();
  }

  fecharModalLogin() {
    this.modalLoginAberto = false;
  }

  irParaLogin() {
    this.fecharModalLogin();
    this.router.navigateByUrl('/login');
  }

  irParaRegisto() {
    this.fecharModalLogin();
    this.router.navigateByUrl('/registo');
  }

  verMenu() {
    this.router.navigateByUrl('/tabs/menu');
  }

  formatarPreco(valor: number): string {
    return `${valor.toFixed(2).replace('.', ',')} €`;
  }

  private obterCarrinhoGuardado(perfil: UtilizadorPerfil): ItemCarrinho[] {
    const dados = localStorage.getItem(this.obterChaveCarrinho(perfil.email));

    if (!dados) {
      return [];
    }

    try {
      return this.normalizarItensCarrinho(JSON.parse(dados));
    } catch {
      return [];
    }
  }

  private async guardarCarrinhoAtual() {
    const perfil = await this.perfilService.obterPerfil();

    if (!perfil) {
      localStorage.setItem(this.obterChaveCarrinhoAnonimo(), JSON.stringify(this.itens));
      window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
      return;
    }

    localStorage.setItem(this.obterChaveCarrinho(perfil.email), JSON.stringify(this.itens));
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }

  private obterChaveCarrinho(email: string): string {
    return `verdevegan_carrinho_${email}`;
  }

  private obterChaveCarrinhoAnonimo(): string {
    return 'verdevegan_carrinho_anonimo';
  }

  private obterCarrinhoAnonimo(): ItemCarrinho[] {
    const dados = localStorage.getItem(this.obterChaveCarrinhoAnonimo());

    if (!dados) {
      return [];
    }

    try {
      return this.normalizarItensCarrinho(JSON.parse(dados));
    } catch {
      return [];
    }
  }

  private normalizarItensCarrinho(dados: unknown): ItemCarrinho[] {
    if (!Array.isArray(dados)) {
      return [];
    }

    return dados
      .map((item: any) => ({
        nome: item.nome || item.prato?.nome || 'Produto',
        quantidade: Number(item.quantidade) || 1,
        preco: Number(item.preco ?? item.totalUnidade ?? item.prato?.preco ?? 0)
      }))
      .filter((item: ItemCarrinho) => item.preco > 0);
  }

  private async atualizarPontosDepoisPedido() {
    if (!this.perfilAtual) {
      return;
    }

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
      this.segundosParaInicio--;

      if (this.segundosParaInicio <= 0) {
        this.limparTemporizadorConfirmacao();
        this.router.navigateByUrl('/tabs/inicio');
      }
    }, 1000);
  }

  private limparTemporizadorConfirmacao() {
    if (this.temporizadorConfirmacao) {
      clearInterval(this.temporizadorConfirmacao);
      this.temporizadorConfirmacao = undefined;
    }
  }
}
