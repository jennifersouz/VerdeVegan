import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService, Prato } from '../../services/menu';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false
})
export class MenuPage implements OnInit {

  public pratos: Prato[] = [];
  public pratosFiltrados: Prato[] = [];

  public termoPesquisa = '';

  public tipoSelecionado = 'Todos';
  public categoriaSelecionada = 'Todas';

  public filtrosAberto = false;

  public filtroOrdenacao = 'Popular';
  public precoMaximo = 50;
  public avaliacaoMinima = 'Todas';

  public carregando = true;
  public erroCarregamento = '';

  public tipos = [
    { nome: 'Todos', icone: 'grid-outline' },
    { nome: 'Refeições', icone: 'restaurant-outline' },
    { nome: 'Bebidas', icone: 'cafe-outline' },
    { nome: 'Sobremesas', icone: 'ice-cream-outline' }
  ];

  public categoriasPrincipais = [
    'Todas',
    'Pizza',
    'Massas',
    'Hambúrgueres',
    'Bowls',
    'Bebidas',
    'Sobremesas',
    'Sushi',
    'Ramen',
    'Tacos',
    'Wraps',
    'Pratos principais',
    'Saladas',
    'Entradas'
  ];

  private readonly emojisCategoria: { [categoria: string]: string } = {
    Todas: '🍽️',
    Pizza: '🍕',
    Massas: '🍝',
    Hambúrgueres: '🍔',
    Bowls: '🥗',
    Bebidas: '🥤',
    Sobremesas: '🍰',
    Sushi: '🍣',
    Ramen: '🍜',
    Tacos: '🌮',
    Wraps: '🌯',
    'Pratos principais': '🍽️',
    Saladas: '🥬',
    Entradas: '🥟',
    Bolos: '🍰',
    'Pratos Quentes': '🍲',
    Sumos: '🧃',
    Smoothies: '🥤',
    Chás: '🍵',
    Cheesecakes: '🍰',
    Mousses: '🍫',
    Panquecas: '🥞',
    Águas: '💧'
  };

  constructor(
    private menuService: MenuService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
  this.carregarPratos();

  this.activatedRoute.queryParamMap.subscribe(params => {
    const tipo = params.get('tipo');
    const categoria = params.get('categoria');
    const pesquisa = params.get('pesquisa');

    this.tipoSelecionado = tipo || 'Todos';
    this.categoriaSelecionada = categoria || 'Todas';
    this.termoPesquisa = pesquisa || '';

    this.filtrarPratos();
  });
}

  ionViewWillEnter() {
    this.filtrosAberto = false;

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();
  }

  private carregarPratos() {
  this.carregando = true;
  this.erroCarregamento = '';

  this.menuService.carregarPratos().subscribe({
    next: (pratos: Prato[]) => {
      this.pratos = pratos;
      this.filtrarPratos();
      this.carregando = false;
    },
    error: (erro: unknown) => {
      console.error('Erro ao carregar menu:', erro);
      this.erroCarregamento = 'Não foi possível carregar o menu. Atualize a página.';
      this.carregando = false;
    }
  });
}

  public selecionarTipo(tipo: string) {
    this.tipoSelecionado = tipo;
    this.categoriaSelecionada = 'Todas';
    this.filtrarPratos();
  }

  public selecionarCategoria(categoria: string) {
    this.categoriaSelecionada = categoria;
    this.filtrarPratos();
  }

  public obterCategoriasVisiveis(): string[] {
    return this.categoriasPrincipais;
  }

  public filtrarPratos() {
    const pesquisa = this.normalizarTexto(this.termoPesquisa);

    const avaliacaoMinima =
      this.avaliacaoMinima === 'Todas' ? 0 : Number(this.avaliacaoMinima);

    let resultado = this.pratos.filter((prato: Prato) => {
      const correspondeTipo =
        this.tipoSelecionado === 'Todos' ||
        prato.tipo === this.tipoSelecionado;

      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        prato.categoria === this.categoriaSelecionada;

      const correspondePesquisa =
        pesquisa.length === 0 ||
        this.normalizarTexto(prato.nome).includes(pesquisa);

      const correspondePreco = prato.preco <= this.precoMaximo;
      const correspondeAvaliacao = prato.avaliacao >= avaliacaoMinima;

      return (
        correspondeTipo &&
        correspondeCategoria &&
        correspondePesquisa &&
        correspondePreco &&
        correspondeAvaliacao
      );
    });

    resultado = this.ordenarPratos(resultado);

    this.pratosFiltrados = resultado;
  }

  public temPesquisaAtiva(): boolean {
    return this.termoPesquisa.trim().length > 0;
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private ordenarPratos(pratos: Prato[]): Prato[] {
    const pratosOrdenados = [...pratos];

    switch (this.filtroOrdenacao) {
      case 'Avaliação':
        return pratosOrdenados.sort((a: Prato, b: Prato) => b.avaliacao - a.avaliacao);

      case 'PrecoAsc':
        return pratosOrdenados.sort((a: Prato, b: Prato) => a.preco - b.preco);

      case 'PrecoDesc':
        return pratosOrdenados.sort((a: Prato, b: Prato) => b.preco - a.preco);

      default:
        return pratosOrdenados.sort((a: Prato, b: Prato) => b.avaliacao - a.avaliacao);
    }
  }

  public obterTituloMenu(): string {
    return 'Todos os pratos';
  }

  public obterEmojiCategoria(categoria: string): string {
    return this.emojisCategoria[categoria] || '🍽️';
  }

  public obterPratosDestaque(): Prato[] {
    return this.pratosFiltrados.filter((prato: Prato) => prato.destaque);
  }

  public abrirDetalhe(id: number) {
    const params = new URLSearchParams();
    params.set('origem', 'menu');

    if (this.termoPesquisa.trim()) {
      params.set('pesquisa', this.termoPesquisa.trim());
    }

    if (this.tipoSelecionado !== 'Todos') {
      params.set('tipo', this.tipoSelecionado);
    }

    if (this.categoriaSelecionada !== 'Todas') {
      params.set('categoria', this.categoriaSelecionada);
    }

    this.router.navigateByUrl(`/tabs/detalhe-prato/${id}?${params.toString()}`);
  }

  public voltar() {
    this.router.navigateByUrl('/tabs/inicio');
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
}
