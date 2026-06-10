import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  MetodoPagamento,
  MoradaEntrega,
  PerfilService,
  UtilizadorPerfil
} from '../../services/perfil';
import { Pedido, Pedidos } from '../../services/pedidos';
import { Carrinho, ItemCarrinho } from '../../services/carrinho';
import { SupabaseService } from '../../services/supabase';

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
    private carrinhoService: Carrinho,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ionViewWillEnter() {
    this.limparTemporizadorConfirmacao();
    this.passoAtual = 1;
    this.atualizarSessao();
  }

  ionViewWillLeave() {
    this.limparTemporizadorConfirmacao();
  }

  ngOnDestroy() {
    this.limparTemporizadorConfirmacao();
  }

  private async atualizarSessao() {
    const perfil = await this.perfilService.obterPerfil();
    this.perfilAtual = perfil;
    this.estaLogado = !!perfil;

    if (!perfil) {
      this.itens = this.carrinhoService.obterItens();
      return;
    }

    this.itens = this.carrinhoService.obterItens(perfil.email);
    this.pontosDisponiveis = perfil.pontos || 0;
    this.telefonePagamento = '';
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
    return Math.max(this.arredondarCentimos(this.totalAntesDesconto - this.descontoTotal), 0);
  }

  get totalAntesDesconto() {
    return this.subtotal + this.taxaEntrega;
  }

  get descontoPontos() {
    return this.pontosARedimir / 10;
  }

  get descontoTotal() {
    return this.descontoPontos + this.descontoCodigo;
  }

  get maximoPontosUsaveis() {
    const totalDescontavel = this.arredondarCentimos(Math.max(this.totalAntesDesconto - this.descontoCodigo, 0));
    return Math.min(this.pontosDisponiveis, Math.floor(totalDescontavel * 10));
  }

  get pontosARedimir() {
    return Math.min(this.pontosUsados, this.maximoPontosUsaveis);
  }

  get pedidoSemValorAPagar() {
    return this.total <= 0;
  }

  get moradaSelecionada() {
    return this.moradas.find((morada) => morada.id === this.moradaSelecionadaId);
  }

  get cartaoSelecionado() {
    return this.metodosPagamento.find((metodo) => metodo.id === this.cartaoSelecionadoId);
  }

  get pagamentoResumo() {
    if (this.pedidoSemValorAPagar) {
      return 'Pago com pontos';
    }

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

  normalizarTelefonePagamento() {
    this.telefonePagamento = this.telefonePagamento.replace(/\D/g, '').slice(0, 9);
  }

  bloquearNaoNumerico(event: KeyboardEvent) {
    const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

    if (
      teclasPermitidas.includes(event.key) ||
      ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  colarApenasNumerosTelefone(event: ClipboardEvent) {
    event.preventDefault();
    const valor = event.clipboardData?.getData('text') || '';
    this.telefonePagamento = valor.replace(/\D/g, '').slice(0, 9);
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
    if (this.pedidoSemValorAPagar) {
      return true;
    }

    if (this.metodoSelecionado === 'cartao') {
      return !!this.cartaoSelecionadoId;
    }

    if (this.metodoSelecionado === 'mbway' || this.metodoSelecionado === 'applepay') {
      return this.telefoneValido(this.telefonePagamento);
    }

    if (this.metodoSelecionado === 'dinheiro') {
      return !!this.pagamentoEntrega;
    }

    return true;
  }

  private telefoneValido(telefone: string): boolean {
    return /^(9[1236]\d{7}|2\d{8})$/.test(telefone.replace(/\D/g, ''));
  }

  async confirmarPedido() {
    if (!this.pagamentoValido() || !this.moradaSelecionada) {
      return;
    }

    const agora = new Date();
    const pedido: Pedido = {
      id: '#VV-' + Math.floor(1000 + Math.random() * 9000),
      email: this.perfilAtual?.email,
      nome: this.itens[0]?.nome || 'Pedido VerdeVegan',
      data: 'Hoje',
      hora: agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      itens: this.itens.reduce((total, item) => total + item.quantidade, 0),
      estado: 'Recebido',
      total: this.total,
      pagamento: this.pagamentoResumo,
      morada: this.moradaSelecionada.titulo,
      moradaDetalhe: `${this.moradaSelecionada.rua}, ${this.moradaSelecionada.numero} · ${this.moradaSelecionada.cidade}`,
      taxaEntrega: this.taxaEntrega,
      pontosGanhos: Math.floor(this.total) * 10,
      pontosUsados: this.pontosARedimir,
      saldoPontos: Math.max(0, (this.perfilAtual?.pontos || 0) - this.pontosARedimir) + Math.floor(this.total) * 10,
      criadoEm: agora.toISOString(),
      tempoConfirmacaoMinutos: 2,
      tempoPreparacaoMinutos: 2,
      tempoCaminhoMinutos: 2,
      tempoEntregaMinutos: 6,
      cancelamentoMinutos: 1,
      artigos: this.itens.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        preco: item.preco * item.quantidade
      }))
    };

    this.pedidosService.adicionarPedido(pedido);
    const { error } = await this.supabaseService.criarPedido(pedido);

    if (error) {
      console.error('Erro ao guardar pedido no Supabase:', error);
    }

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
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/tabs/carrinho' } });
  }

  irParaRegisto() {
    this.fecharModalLogin();
    this.router.navigate(['/registo'], { queryParams: { returnUrl: '/tabs/carrinho' } });
  }

  verMenu() {
    this.router.navigateByUrl('/tabs/menu');
  }

  formatarPreco(valor: number): string {
    return `${valor.toFixed(2).replace('.', ',')} €`;
  }

  private arredondarCentimos(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private async guardarCarrinhoAtual() {
    const perfil = await this.perfilService.obterPerfil();
    this.carrinhoService.guardarItens(this.itens, perfil?.email);
  }

  private async atualizarPontosDepoisPedido() {
    if (!this.perfilAtual) {
      return;
    }

    const pontosGanhos = Math.floor(this.total) * 10;
    const perfilAtualizado: UtilizadorPerfil = {
      ...this.perfilAtual,
      pontos: Math.max(0, (this.perfilAtual.pontos || 0) - this.pontosARedimir) + pontosGanhos
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

        if (this.router.url.includes('/tabs/carrinho') && this.passoAtual === 5 && this.pedidoConfirmado) {
          this.router.navigateByUrl('/tabs/inicio');
        }
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
