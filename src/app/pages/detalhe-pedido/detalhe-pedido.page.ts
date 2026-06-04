import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CarrinhoService } from '../../services/carrinho';
import { Pedido, Pedidos } from '../../services/pedidos';

@Component({
  selector: 'app-detalhe-pedido',
  templateUrl: './detalhe-pedido.page.html',
  styleUrls: ['./detalhe-pedido.page.scss'],
  standalone: false
})
export class DetalhePedidoPage implements OnDestroy {

  public pedido: Pedido | null = null;
  public carregando = true;
  public mostrarModalCancelar = false;
  public segundosParaCancelar = 0;
  public avaliacao = 0;
  public comentario = '';
  public avaliacaoSubmetida = false;
  public mostrarDetalhesRecebido = false;

  // Verifica mudança de estado a cada segundo — só toca em this.pedido se mudou
  private intervaloEstado: ReturnType<typeof setInterval> | null = null;
  // Actualiza apenas segundosParaCancelar — nunca altera this.pedido
  private intervaloCancelamento: ReturnType<typeof setInterval> | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private pedidosService: Pedidos,
    private carrinhoService: CarrinhoService
  ) {}

  async ionViewWillEnter() {
    this.pararVerificacaoEstado();
    this.pararTimerCancelamento();
    this.mostrarModalCancelar = false;
    this.mostrarDetalhesRecebido = false;

    await this.carregarPedido();
    this.iniciarTimerCancelamento();
    this.iniciarVerificacaoEstado();
  }

  ionViewWillLeave() {
    this.pararVerificacaoEstado();
    this.pararTimerCancelamento();
  }

  ngOnDestroy() {
    this.pararVerificacaoEstado();
    this.pararTimerCancelamento();
  }

  // ── Carregamento inicial / após ações fortes ─────────────────────────────
  private async carregarPedido() {
    this.carregando = true;

    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    if (!id) {
      await this.router.navigateByUrl('/tabs/pedidos', { replaceUrl: true });
      return;
    }

    const pedidoEncontrado = await this.pedidosService.obterPedidoPorId(id);

    if (!pedidoEncontrado) {
      await this.router.navigateByUrl('/tabs/pedidos', { replaceUrl: true });
      return;
    }

    this.pedido = pedidoEncontrado;
    this.avaliacao = this.pedido.avaliacao || 0;
    this.comentario = this.pedido.comentario || '';
    this.avaliacaoSubmetida = (this.pedido.avaliacao ?? 0) > 0;
    this.atualizarTimerCancelamento();
    this.carregando = false;
  }

  // Usado após cancelar/avaliar para reflectir o novo estado sem reiniciar timers
  private async atualizarPedidoAposAcao() {
    if (!this.pedido) return;
    const atualizado = await this.pedidosService.obterPedidoPorId(this.pedido.id);
    if (atualizado) {
      this.pedido = atualizado;
    }
  }

  // ── Verificação de estado — leve, só altera this.pedido se estado mudou ──
  private iniciarVerificacaoEstado() {
    this.pararVerificacaoEstado();

    this.intervaloEstado = setInterval(async () => {
      if (!this.pedido) return;

      // Pedidos terminais não precisam de verificação
      if (this.pedido.estado === 'Entregue' || this.pedido.estado === 'Cancelado') {
        this.pararVerificacaoEstado();
        return;
      }

      const atualizado = await this.pedidosService.obterPedidoPorId(this.pedido.id);
      if (!atualizado) return;

      // Só substitui this.pedido se o estado realmente mudou — evita flicker
      if (atualizado.estado !== this.pedido.estado) {
        this.pedido = atualizado;

        if (this.pedido.estado === 'Entregue' || this.pedido.estado === 'Cancelado') {
          this.pararVerificacaoEstado();
          this.pararTimerCancelamento();
        }
      }
    }, 1000);
  }

  private pararVerificacaoEstado() {
    if (this.intervaloEstado) {
      clearInterval(this.intervaloEstado);
      this.intervaloEstado = null;
    }
  }

  // ── Timer de cancelamento — só altera segundosParaCancelar ───────────────
  private iniciarTimerCancelamento() {
    this.pararTimerCancelamento();
    this.atualizarTimerCancelamento();

    this.intervaloCancelamento = setInterval(() => {
      this.atualizarTimerCancelamento();
      if (this.segundosParaCancelar <= 0) {
        this.pararTimerCancelamento();
      }
    }, 1000);
  }

  private atualizarTimerCancelamento() {
    if (!this.pedido?.cancelavelAte) {
      this.segundosParaCancelar = 0;
      return;
    }
    const restante = Math.ceil((this.pedido.cancelavelAte - Date.now()) / 1000);
    this.segundosParaCancelar = Math.max(0, restante);
  }

  private pararTimerCancelamento() {
    if (this.intervaloCancelamento) {
      clearInterval(this.intervaloCancelamento);
      this.intervaloCancelamento = null;
    }
  }

  // ── Cancelamento ─────────────────────────────────────────────────────────
  public podeCancelar(): boolean {
    return !!this.pedido &&
      this.pedido.estado === 'Recebido' &&
      this.segundosParaCancelar > 0;
  }

  public abrirModalCancelar() {
    if (this.podeCancelar()) {
      this.mostrarModalCancelar = true;
    }
  }

  public fecharModalCancelar() {
    this.mostrarModalCancelar = false;
  }

  public async confirmarCancelamento() {
    if (!this.pedido) return;

    this.mostrarModalCancelar = false;
    await this.pedidosService.cancelarPedido(this.pedido.id);
    await this.atualizarPedidoAposAcao();
    this.pararVerificacaoEstado();
    this.pararTimerCancelamento();
  }

  // ── Avaliação ────────────────────────────────────────────────────────────
  public definirAvaliacao(valor: number) {
    if (!this.avaliacaoSubmetida) {
      this.avaliacao = valor;
    }
  }

  public async submeterAvaliacao() {
    if (!this.pedido || this.avaliacao === 0) return;

    await this.pedidosService.avaliarPedido(this.pedido.id, this.avaliacao, this.comentario);
    this.avaliacaoSubmetida = true;
    this.desfocarElementoAtivo();
    await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }

  // ── Repetir pedido ───────────────────────────────────────────────────────
  public async repetirPedido() {
    if (!this.pedido) return;

    for (const item of this.pedido.itens) {
      const idBase = Date.now() + Math.floor(Math.random() * 1000);
      await this.carrinhoService.adicionarItem({
        id: idBase,
        prato: {
          id: idBase,
          nome: item.nome,
          tipo: 'Refeições',
          categoria: 'Pedido anterior',
          restaurante: this.pedido.restaurante,
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

    this.desfocarElementoAtivo();
    await this.router.navigateByUrl('/tabs/carrinho');
  }

  // ── Navegação ────────────────────────────────────────────────────────────
  public voltar() {
    this.desfocarElementoAtivo();
    this.router.navigateByUrl('/tabs/pedidos');
  }

  public voltarAoInicio() {
    this.desfocarElementoAtivo();
    this.router.navigateByUrl('/tabs/inicio');
  }

  public voltarAosPedidos() {
    this.voltar();
  }

  public irParaMenu() {
    this.desfocarElementoAtivo();
    this.router.navigateByUrl('/tabs/menu');
  }

  public verDetalhesPedido() {
    this.mostrarDetalhesRecebido = true;
    setTimeout(() => {
      document.getElementById('detalhes-pedido')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // ── Cálculos ─────────────────────────────────────────────────────────────
  public obterSubtotal(): number {
    if (!this.pedido) return 0;
    return this.pedido.itens.reduce((total, item) => total + item.preco * item.quantidade, 0);
  }

  public obterTotalPedido(): number {
    if (!this.pedido) return 0;
    const subtotal = this.obterSubtotal();
    const taxaEntrega = this.pedido.taxaEntrega || 0;
    const desconto = this.pedido.desconto || 0;
    return Math.max(0, subtotal + taxaEntrega - desconto);
  }

  public obterTempoCancelamento(): string {
    return `00:${String(this.segundosParaCancelar).padStart(2, '0')}`;
  }

  public obterHoraEstimada(): string {
    if (!this.pedido?.estimativaEntregaEm) return '';
    const data = new Date(this.pedido.estimativaEntregaEm);
    return data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }

  public obterMinutosRestantesEntrega(): number {
    if (!this.pedido?.estimativaEntregaEm) return 0;
    const diferenca = this.pedido.estimativaEntregaEm - Date.now();
    const minutos = Math.ceil(diferenca / 60000);
    return Math.max(1, minutos);
  }

  // Mantido por retrocompatibilidade com o template (usado em "Chega em X min")
  public obterMinutosEntrega(): string {
    return `${this.obterMinutosRestantesEntrega()} min`;
  }

  public obterPercentagemProgresso(): number {
    if (!this.pedido) return 0;
    if (this.pedido.estado === 'Recebido')   return 22;
    if (this.pedido.estado === 'A preparar') return 52;
    if (this.pedido.estado === 'A caminho')  return 82;
    if (this.pedido.estado === 'Entregue')   return 100;
    return 0;
  }

  public estaEntregue(): boolean {
    return this.pedido?.estado === 'Entregue';
  }

  public estaCancelado(): boolean {
    return this.pedido?.estado === 'Cancelado';
  }

  private desfocarElementoAtivo() {
    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }
}
