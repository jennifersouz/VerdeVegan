import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InicioService } from '../../services/inicio';
import { Prato } from '../../services/menu';

interface RestauranteResumo {
  id: number;
  nome: string;
  categorias: string[];
  imagem: string;
  avaliacao: number;
  tempo: string;
  taxaEntrega: string;
  opcoes: number;
  destaque: boolean;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false
})
export class InicioPage implements OnInit {

  public pratos: Prato[] = [];
  public pratosFiltrados: Prato[] = [];
  public restaurantes: RestauranteResumo[] = [
    {
      id: 6,
      nome: 'Pizzaria Luzzo',
      categorias: ['Entradas', 'Pizza', 'Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/pizzaria-luzo.jpg',
      avaliacao: 4.6,
      tempo: '30-40min',
      taxaEntrega: '€2.40 entrega',
      opcoes: 5,
      destaque: true
    },
    {
      id: 7,
      nome: 'Massas Caseiras',
      categorias: ['Entradas', 'Massas', 'Sobremesas'],
      imagem: 'assets/imagens/massas-caseiras.jpg',
      avaliacao: 4.7,
      tempo: '30-40min',
      taxaEntrega: '€1.90 entrega',
      opcoes: 6,
      destaque: true
    },
    {
      id: 20,
      nome: 'Green Burger Lab',
      categorias: ['Entradas', 'Pratos principais', 'Hambúrgueres', 'Sobremesas'],
      imagem: 'assets/imagens/green-burguer-lab.jpg',
      avaliacao: 4.6,
      tempo: '20-30min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 5,
      destaque: true
    },
    {
      id: 4,
      nome: 'Bowl Garden',
      categorias: ['Entradas', 'Bowls', 'Bebidas'],
      imagem: 'assets/imagens/bowl-garden.jpg',
      avaliacao: 4.6,
      tempo: '25-35min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 5,
      destaque: true
    },
    {
      id: 21,
      nome: 'Taco Verde',
      categorias: ['Entradas', 'Tacos', 'Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/taco-verde.jpg',
      avaliacao: 4.5,
      tempo: '20-30min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 5,
      destaque: true
    },
    {
      id: 12,
      nome: 'Sushi Raiz',
      categorias: ['Entradas', 'Sushi', 'Ramen', 'Sobremesas'],
      imagem: 'assets/imagens/sushi-raiz.jpg',
      avaliacao: 4.6,
      tempo: '25-35min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4,
      destaque: true
    },
    {
      id: 1,
      nome: 'Doce Planta',
      categorias: ['Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/doce-planta.jpg',
      avaliacao: 4.7,
      tempo: '15-25min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4,
      destaque: false
    },
    {
      id: 19,
      nome: 'Folha Fresca',
      categorias: ['Entradas', 'Wraps', 'Saladas', 'Bebidas'],
      imagem: 'assets/imagens/folha-fresca.jpg',
      avaliacao: 4.5,
      tempo: '15-20min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4,
      destaque: false
    },
    {
      id: 9,
      nome: 'Brunch Verde',
      categorias: ['Entradas', 'Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/brunch-verde.jpg',
      avaliacao: 4.5,
      tempo: '10-20min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4,
      destaque: false
    }
  ];
  public restaurantesFiltrados: RestauranteResumo[] = [];
  public categorias = [
    { nome: 'Todas', emoji: '🍽️' },
    { nome: 'Pizza', emoji: '🍕' },
    { nome: 'Massas', emoji: '🍝' },
    { nome: 'Hambúrgueres', emoji: '🍔' },
    { nome: 'Bowls', emoji: '🥗' },
    { nome: 'Bebidas', emoji: '🥤' },
    { nome: 'Sobremesas', emoji: '🍰' },
    { nome: 'Sushi', emoji: '🍣' },
    { nome: 'Ramen', emoji: '🍜' },
    { nome: 'Tacos', emoji: '🌮' },
    { nome: 'Wraps', emoji: '🌯' },
    { nome: 'Pratos principais', emoji: '🍽️' },
    { nome: 'Saladas', emoji: '🥬' },
    { nome: 'Entradas', emoji: '🥟' }
  ];

  public termoPesquisa = '';
  public categoriaSelecionada = 'Todas';
  public filtrosAberto = false;

  public filtroOrdenacao = 'Popular';
  public precoMaximo = 50;
  public avaliacaoMinima = 'Todas';

  public carregando = true;
  public erroCarregamento = '';
  public moradaAtual = 'A obter localização...';
  public localizacaoAtiva = true;
  public menuLocalizacaoAberto = false;

  private readonly chaveLocalizacaoAtiva = 'verdevegan_localizacao_ativa';
  private readonly textoLocalizacaoDesativada = 'Localização desativada';

  constructor(
    private inicioService: InicioService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.lerParametrosDaRota();
    this.inicializarLocalizacao();
    this.carregarPratos();
  }

  ionViewWillEnter() {
    this.filtrosAberto = false;

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }

  public abrirMenuComTipo(tipo: string) {
  this.router.navigateByUrl(
    `/tabs/menu?tipo=${encodeURIComponent(tipo)}`
  );
}

  private lerParametrosDaRota() {
    const categoria = this.activatedRoute.snapshot.queryParamMap.get('categoria');
    const pesquisa = this.activatedRoute.snapshot.queryParamMap.get('pesquisa');

    if (categoria) {
      this.categoriaSelecionada = categoria;
    }

    if (pesquisa) {
      this.termoPesquisa = pesquisa;
    }
  }

  private carregarPratos() {
    this.carregando = true;
    this.erroCarregamento = '';

    this.inicioService.carregarDestaques().subscribe({
      next: (pratos: Prato[]) => {
        this.pratos = pratos;
        this.filtrarPratos();
        this.carregando = false;
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar pratos em destaque:', erro);
        this.erroCarregamento = 'Não foi possível carregar os pratos. Atualize a página.';
        this.carregando = false;
      }
    });
  }

  public selecionarCategoria(categoria: string) {
    this.categoriaSelecionada = categoria;
    this.filtrarPratos();
  }

  public filtrarPratos() {
    const pesquisa = this.normalizarTexto(this.termoPesquisa);
    const avaliacaoMinima =
      this.avaliacaoMinima === 'Todas' ? 0 : Number(this.avaliacaoMinima);

    this.restaurantesFiltrados = this.restaurantes.filter((restaurante: RestauranteResumo) => {
      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        restaurante.categorias.includes(this.categoriaSelecionada);

      const correspondePesquisa =
        pesquisa.length === 0 ||
        this.normalizarTexto(restaurante.nome).includes(pesquisa);

      const correspondeAvaliacao = restaurante.avaliacao >= avaliacaoMinima;

      return correspondeCategoria && correspondePesquisa && correspondeAvaliacao;
    });

    let pratosFiltrados = this.pratos.filter((prato: Prato) => {
      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        prato.categoria === this.categoriaSelecionada;

      const correspondePesquisa =
        pesquisa.length === 0 ||
        this.normalizarTexto(prato.nome).includes(pesquisa);

      const correspondePreco = prato.preco <= this.precoMaximo;
      const correspondeAvaliacao = prato.avaliacao >= avaliacaoMinima;

      return (
        correspondeCategoria &&
        correspondePesquisa &&
        correspondePreco &&
        correspondeAvaliacao
      );
    });

    switch (this.filtroOrdenacao) {
      case 'Avaliação':
        pratosFiltrados = pratosFiltrados.sort(
          (a: Prato, b: Prato) => b.avaliacao - a.avaliacao
        );
        break;

      case 'PrecoAsc':
        pratosFiltrados = pratosFiltrados.sort(
          (a: Prato, b: Prato) => a.preco - b.preco
        );
        break;

      case 'PrecoDesc':
        pratosFiltrados = pratosFiltrados.sort(
          (a: Prato, b: Prato) => b.preco - a.preco
        );
        break;

      default:
        pratosFiltrados = pratosFiltrados.sort(
          (a: Prato, b: Prato) => b.avaliacao - a.avaliacao
        );
        break;
    }

    this.pratosFiltrados = pratosFiltrados;
  }

  public abrirRestaurante(id: number) {
    this.router.navigateByUrl(`/tabs/restaurante/${id}`);
  }

  public abrirPrato(id: number) {
    this.router.navigateByUrl(`/tabs/detalhe-prato/${id}?origem=menu`);
  }

  public obterRestaurantesDestaque(): RestauranteResumo[] {
    return this.restaurantesFiltrados.filter((restaurante: RestauranteResumo) => restaurante.destaque);
  }

  public obterMaisPedidos(): Prato[] {
    if (this.temPesquisaAtiva()) {
      return [];
    }

    return this.pratos
      .filter((prato: Prato) => prato.destaque)
      .slice(0, 8);
  }

  public temPesquisaAtiva(): boolean {
    return this.termoPesquisa.trim().length > 0;
  }

  public abrirMenuComCategoria(categoria: string) {
    this.router.navigateByUrl(
      `/tabs/menu?categoria=${encodeURIComponent(categoria)}`
    );
  }

  public pesquisarNoMenu() {
    this.filtrarPratos();
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  public terminarSessao() {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  public abrirFiltros() {
    this.filtrosAberto = true;
  }

  public fecharFiltros() {
    this.filtrosAberto = false;

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }

  public selecionarOrdenacao(valor: string) {
    this.filtroOrdenacao = valor;
  }

  public selecionarAvaliacao(valor: string) {
    this.avaliacaoMinima = valor;
  }

  public concluirFiltros() {
    this.filtrarPratos();
    this.filtrosAberto = false;

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }

  private inicializarLocalizacao() {
    const localizacaoGuardada = localStorage.getItem(this.chaveLocalizacaoAtiva);
    this.localizacaoAtiva = localizacaoGuardada !== 'false';

    if (this.localizacaoAtiva) {
      this.atualizarMoradaAtual();
    } else {
      this.moradaAtual = this.textoLocalizacaoDesativada;
    }
  }

  public abrirMenuLocalizacao() {
    this.menuLocalizacaoAberto = true;
  }

  public fecharMenuLocalizacao() {
    this.menuLocalizacaoAberto = false;
  }

  public alternarLocalizacao() {
    this.localizacaoAtiva = !this.localizacaoAtiva;
    localStorage.setItem(this.chaveLocalizacaoAtiva, String(this.localizacaoAtiva));
    this.menuLocalizacaoAberto = false;

    if (this.localizacaoAtiva) {
      this.atualizarMoradaAtual();
    } else {
      this.moradaAtual = this.textoLocalizacaoDesativada;
    }
  }

  public atualizarMoradaAtual() {
    if (!this.localizacaoAtiva) {
      this.moradaAtual = this.textoLocalizacaoDesativada;
      return;
    }

    if (!('geolocation' in navigator)) {
      this.moradaAtual = 'Localização indisponível';
      return;
    }

    this.moradaAtual = 'A obter localização...';

    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const { latitude, longitude } = posicao.coords;

        try {
          const morada = await this.obterMoradaPorCoordenadas(latitude, longitude);

          if (morada) {
            this.moradaAtual = morada;
          } else {
            this.moradaAtual = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          }
        } catch (erro) {
          console.error('Erro ao obter morada por GPS:', erro);
          this.moradaAtual = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
      },
      (erro) => {
        console.error('Permissão/localização indisponível:', erro);
        this.moradaAtual = erro.code === erro.PERMISSION_DENIED
          ? 'Permite a localização no browser'
          : 'Localização indisponível';
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }

  private async obterMoradaPorCoordenadas(latitude: number, longitude: number): Promise<string> {
    const moradaNominatim = await this.obterMoradaNominatim(latitude, longitude);

    if (moradaNominatim) {
      return moradaNominatim;
    }

    return await this.obterMoradaBigDataCloud(latitude, longitude);
  }

  private async obterMoradaNominatim(latitude: number, longitude: number): Promise<string> {
    try {
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-PT`
      );

      if (!resposta.ok) {
        return '';
      }

      const dados = await resposta.json();
      return this.formatarMorada(dados?.address, dados?.display_name);
    } catch (erro) {
      console.error('Nominatim falhou:', erro);
      return '';
    }
  }

  private async obterMoradaBigDataCloud(latitude: number, longitude: number): Promise<string> {
    try {
      const resposta = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
      );

      if (!resposta.ok) {
        return '';
      }

      const dados = await resposta.json();
      const rua = dados?.localityInfo?.informative
        ?.find((item: any) => item.description === 'road')?.name;

      const localidade = dados?.locality || dados?.city || dados?.principalSubdivision;
      return rua || localidade || '';
    } catch (erro) {
      console.error('BigDataCloud falhou:', erro);
      return '';
    }
  }

  private formatarMorada(address: any, displayName?: string): string {
    const rua = address?.road || address?.pedestrian || address?.footway || address?.neighbourhood;
    const numero = address?.house_number;
    const cidade = address?.city || address?.town || address?.village || address?.municipality;

    if (rua && numero) {
      return `${rua}, ${numero}`;
    }

    if (rua || cidade) {
      return rua || cidade;
    }

    if (displayName) {
      return displayName.split(',').slice(0, 2).join(',').trim();
    }

    return '';
  }
}
