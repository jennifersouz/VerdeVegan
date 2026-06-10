import { Component, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ArtigoPedido, EstadoPedido, Pedido, Pedidos } from 'src/app/services/pedidos';
import { PerfilService } from 'src/app/services/perfil';

interface PassoPedido {
  numero: number;
  label: string;
  estado: EstadoPedido;
}

interface Coordenada {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-acompanhar-pedido',
  templateUrl: './acompanhar-pedido.page.html',
  styleUrls: ['./acompanhar-pedido.page.scss'],
  standalone: false
})
export class AcompanharPedidoPage implements OnDestroy {
  pedido?: Pedido;
  agora = new Date();
  avaliacao = 0;
  comentario = '';
  estrelas = [1, 2, 3, 4, 5];
  mapaUrl?: SafeResourceUrl;
  restaurantePosicao = { x: 36, y: 42 };
  casaPosicao = { x: 78, y: 72 };
  estafetaPosicao = { x: 36, y: 42 };
  restauranteNome = 'VerdeVegan';

  passos: PassoPedido[] = [
    { numero: 1, label: 'Confirmado!', estado: 'Recebido' },
    { numero: 2, label: 'Em preparação', estado: 'A preparar' },
    { numero: 3, label: 'A caminho', estado: 'A caminho' },
    { numero: 4, label: 'Entregue', estado: 'Entregue' }
  ];

  private email?: string;
  private temporizador?: ReturnType<typeof setInterval>;
  private entrega: Coordenada = { lat: 41.6932, lng: -8.8329 };
  private restaurante: Coordenada = { lat: 41.6947, lng: -8.8274 };
  private mapaLimites = {
    minLat: 41.689,
    maxLat: 41.699,
    minLng: -8.838,
    maxLng: -8.823
  };
  private readonly restaurantes: Record<string, Coordenada> = {
    'Pizzaria Luzzo': { lat: 41.6958, lng: -8.8271 },
    'Massas Caseiras': { lat: 41.6929, lng: -8.8317 },
    'Bowl Garden': { lat: 41.6972, lng: -8.8341 },
    'Green Burger Lab': { lat: 41.6909, lng: -8.8264 },
    'Taco Verde': { lat: 41.6965, lng: -8.8206 },
    'Sushi Raiz': { lat: 41.6889, lng: -8.8294 },
    'Doce Planta': { lat: 41.6991, lng: -8.8322 },
    'Folha Fresca': { lat: 41.6916, lng: -8.8381 },
    'Brunch Verde': { lat: 41.7002, lng: -8.8252 },
    'VerdeVegan': { lat: 41.6947, lng: -8.8274 }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidosService: Pedidos,
    private perfilService: PerfilService,
    private sanitizer: DomSanitizer
  ) {}

  ionViewWillEnter() {
    this.carregarPedido();
    this.iniciarTemporizador();
  }

  ionViewWillLeave() {
    this.pararTemporizador();
  }

  ngOnDestroy() {
    this.pararTemporizador();
  }

  async carregarPedido() {
    this.agora = new Date();
    const perfil = await this.perfilService.obterPerfil();
    const id = this.route.snapshot.paramMap.get('id');
    const pedidos = perfil ? this.pedidosService.obterPedidos(perfil.email) : this.pedidosService.obterPedidos();

    this.email = perfil?.email;
    this.pedido = id ? this.pedidosService.obterPedidoPorId(id, perfil?.email) : pedidos[0];
    this.restauranteNome = this.obterRestaurantePedido();
    this.restaurante = this.restaurantes[this.restauranteNome] || this.restaurantes['VerdeVegan'];
    this.prepararMapa();
    this.atualizarPosicoesMapa();
    this.pedirLocalizacaoEntrega();
    this.sincronizarEstadoAutomatico();
  }

  get estadoAtual(): EstadoPedido {
    if (!this.pedido) {
      return 'Recebido';
    }

    return this.pedidosService.obterEstadoAtual(this.pedido, this.agora);
  }

  get passoAtual(): number {
    const estado = this.estadoAtual;

    if (estado === 'Entregue') {
      return 4;
    }

    if (estado === 'A caminho') {
      return 3;
    }

    if (estado === 'A preparar') {
      return 2;
    }

    return 1;
  }

  get tituloPagina(): string {
    switch (this.estadoAtual) {
      case 'A preparar':
        return 'Na cozinha! O chef está a preparar tudo com carinho';
      case 'A caminho':
        return 'O estafeta já saiu!';
      case 'Entregue':
        return 'Pedido Entregue! Bom apetite!';
      case 'Cancelado':
        return 'Pedido cancelado';
      default:
        return 'Pedido Confirmado! A tua refeição está a ser processada';
    }
  }

  get tituloCard(): string {
    switch (this.estadoAtual) {
      case 'A preparar':
        return 'Em preparação';
      case 'A caminho':
        return 'A caminho';
      case 'Entregue':
        return 'Pedido entregue!';
      case 'Cancelado':
        return 'Pedido cancelado';
      default:
        return 'Pedido recebido!';
    }
  }

  get descricaoCard(): string {
    switch (this.estadoAtual) {
      case 'A preparar':
        return 'O restaurante está a preparar a tua refeição.';
      case 'A caminho':
        return 'O estafeta está a caminho da tua morada.';
      case 'Entregue':
        return 'O teu pedido foi entregue com sucesso.';
      case 'Cancelado':
        return 'Este pedido foi cancelado.';
      default:
        return 'Confirmámos o teu pedido com o restaurante.';
    }
  }

  get artigos(): ArtigoPedido[] {
    if (!this.pedido) {
      return [];
    }

    if (this.pedido.artigos?.length) {
      return this.pedido.artigos;
    }

    return [{
      nome: this.pedido.nome,
      quantidade: this.pedido.itens,
      preco: this.subtotal
    }];
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

  get taxaEntrega(): number {
    return this.pedido?.taxaEntrega ?? 2.4;
  }

  get chegadaEstimada(): string {
    const criadoEm = this.obterCriadoEm();
    const minutos = this.pedido?.tempoEntregaMinutos ?? 6;

    return this.formatarHora(new Date(criadoEm.getTime() + minutos * 60000));
  }

  get textoEstado(): string {
    return `Estado: ${this.estadoAtual}  Hoje às ${this.formatarHora(this.agora)}`;
  }

  get tempoCancelamento(): string {
    const ms = this.msCancelamentoRestante;
    const segundosTotais = Math.max(0, Math.ceil(ms / 1000));
    const minutos = Math.floor(segundosTotais / 60).toString().padStart(2, '0');
    const segundos = (segundosTotais % 60).toString().padStart(2, '0');

    return `${minutos}:${segundos}`;
  }

  get podeCancelar(): boolean {
    return this.estadoAtual !== 'Entregue' &&
      this.estadoAtual !== 'Cancelado' &&
      this.msCancelamentoRestante > 0;
  }

  get mostrarCancelamentoExpirado(): boolean {
    return this.estadoAtual !== 'Entregue' &&
      this.estadoAtual !== 'Cancelado' &&
      !!this.pedido?.criadoEm &&
      this.msCancelamentoRestante <= 0;
  }

  get mostrarAvaliacao(): boolean {
    return this.estadoAtual === 'Entregue';
  }

  selecionarPasso(_passo: PassoPedido) {
    return;
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

  cancelarPedido() {
    if (!this.pedido || !this.podeCancelar) {
      return;
    }

    this.pedido = {
      ...this.pedido,
      estado: 'Cancelado',
      estadoManual: 'Cancelado'
    };
    this.pedidosService.atualizarPedido(this.pedido);
  }

  confirmarEntregaEAvaliacao() {
    if (!this.pedido) {
      return;
    }

    this.pedido = {
      ...this.pedido,
      estado: 'Entregue',
      estadoManual: 'Entregue'
    };
    this.pedidosService.atualizarPedido(this.pedido);
  }

  irDetalhes() {
    if (!this.pedido) {
      return;
    }

    this.router.navigate(['/tabs/detalhe-pedido', this.pedido.id.replace('#', '')]);
  }

  voltar() {
    this.router.navigateByUrl('/tabs/pedidos');
  }

  formatarMoeda(valor: number): string {
    return `${valor.toFixed(2).replace('.', ',')} €`;
  }

  private get msCancelamentoRestante(): number {
    if (!this.pedido?.criadoEm) {
      return 0;
    }

    const criadoEm = this.obterCriadoEm();
    const minutos = this.pedido?.cancelamentoMinutos ?? 1;
    const terminaEm = criadoEm.getTime() + minutos * 60000;

    return terminaEm - this.agora.getTime();
  }

  private iniciarTemporizador() {
    this.pararTemporizador();
    this.temporizador = setInterval(() => {
      this.agora = new Date();
      this.atualizarPosicoesMapa();
      this.sincronizarEstadoAutomatico();
    }, 1000);
  }

  private pararTemporizador() {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }

  private sincronizarEstadoAutomatico() {
    if (!this.pedido || this.pedido.estadoManual === 'Cancelado' || this.pedido.estadoManual === 'Entregue') {
      return;
    }

    const estado = this.pedidosService.obterEstadoAtual(this.pedido, this.agora);

    if (estado !== this.pedido.estado) {
      this.pedido = {
        ...this.pedido,
        estado,
        estadoManual: undefined
      };
      this.pedidosService.atualizarPedido(this.pedido);
    }
  }

  private obterCriadoEm(): Date {
    if (this.pedido?.criadoEm) {
      return new Date(this.pedido.criadoEm);
    }

    return new Date();
  }

  private formatarHora(data: Date): string {
    return data.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private pedirLocalizacaoEntrega() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        this.entrega = {
          lat: posicao.coords.latitude,
          lng: posicao.coords.longitude
        };
        this.prepararMapa();
        this.atualizarPosicoesMapa();
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000
      }
    );
  }

  private prepararMapa() {
    const paddingLat = Math.max(Math.abs(this.entrega.lat - this.restaurante.lat) * 0.35, 0.004);
    const paddingLng = Math.max(Math.abs(this.entrega.lng - this.restaurante.lng) * 0.35, 0.006);

    this.mapaLimites = {
      minLat: Math.min(this.entrega.lat, this.restaurante.lat) - paddingLat,
      maxLat: Math.max(this.entrega.lat, this.restaurante.lat) + paddingLat,
      minLng: Math.min(this.entrega.lng, this.restaurante.lng) - paddingLng,
      maxLng: Math.max(this.entrega.lng, this.restaurante.lng) + paddingLng
    };

    const bbox = [
      this.mapaLimites.minLng,
      this.mapaLimites.minLat,
      this.mapaLimites.maxLng,
      this.mapaLimites.maxLat
    ].join('%2C');
    const marker = `${this.entrega.lat}%2C${this.entrega.lng}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

    this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private atualizarPosicoesMapa() {
    this.restaurantePosicao = this.converterCoordenadaParaPosicao(this.restaurante);
    this.casaPosicao = this.converterCoordenadaParaPosicao(this.entrega);

    const progresso = this.obterProgressoEstafeta();
    this.estafetaPosicao = {
      x: this.restaurantePosicao.x + (this.casaPosicao.x - this.restaurantePosicao.x) * progresso,
      y: this.restaurantePosicao.y + (this.casaPosicao.y - this.restaurantePosicao.y) * progresso
    };
  }

  private converterCoordenadaParaPosicao(coordenada: Coordenada): { x: number; y: number } {
    const largura = this.mapaLimites.maxLng - this.mapaLimites.minLng || 1;
    const altura = this.mapaLimites.maxLat - this.mapaLimites.minLat || 1;
    const x = ((coordenada.lng - this.mapaLimites.minLng) / largura) * 100;
    const y = (1 - (coordenada.lat - this.mapaLimites.minLat) / altura) * 100;

    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(88, Math.max(8, y))
    };
  }

  private obterProgressoEstafeta(): number {
    if (this.estadoAtual === 'Entregue') {
      return 1;
    }

    if (this.estadoAtual !== 'A caminho') {
      return 0;
    }

    const criadoEm = this.obterCriadoEm().getTime();
    const confirmacao = (this.pedido?.tempoConfirmacaoMinutos ?? 2) * 60000;
    const preparacao = (this.pedido?.tempoPreparacaoMinutos ?? 2) * 60000;
    const entrega = (this.pedido?.tempoEntregaMinutos ?? 6) * 60000;
    const caminho = (this.pedido?.tempoCaminhoMinutos ?? 2) * 60000;
    const inicioCaminho = criadoEm + confirmacao + preparacao;
    const fimCaminho = criadoEm + Math.max(entrega, confirmacao + preparacao + caminho);

    return Math.min(1, Math.max(0, (this.agora.getTime() - inicioCaminho) / (fimCaminho - inicioCaminho || 1)));
  }

  private obterRestaurantePedido(): string {
    const nomes = Object.keys(this.restaurantes);

    if (!this.pedido) {
      return 'VerdeVegan';
    }

    const dados = this.pedido.data.split('·')[0];
    const restaurantePorData = nomes.find((nome) => dados.includes(nome));

    if (restaurantePorData) {
      return restaurantePorData;
    }

    const restaurantePorPrato = nomes.find((nome) => this.pedido?.nome.toLowerCase().includes(nome.toLowerCase()));

    if (restaurantePorPrato) {
      return restaurantePorPrato;
    }

    return 'VerdeVegan';
  }
}
