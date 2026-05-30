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
    let itens = this.pratos;

    if (this.tipoSelecionado !== 'Todos') {
      itens = itens.filter((prato: Prato) => prato.tipo === this.tipoSelecionado);
    }

    const categorias = itens.map((prato: Prato) => prato.categoria);
    const categoriasUnicas = Array.from(new Set(categorias));

    return ['Todas', ...categoriasUnicas];
  }

  public filtrarPratos() {
    const pesquisa = this.termoPesquisa.trim().toLowerCase();

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
        prato.nome.toLowerCase().includes(pesquisa) ||
        prato.restaurante.toLowerCase().includes(pesquisa) ||
        prato.descricao.toLowerCase().includes(pesquisa) ||
        prato.categoria.toLowerCase().includes(pesquisa) ||
        prato.tipo.toLowerCase().includes(pesquisa);

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
    if (this.tipoSelecionado === 'Todos') {
      return 'Menu';
    }

    return this.tipoSelecionado;
  }

  public abrirDetalhe(id: number) {
    this.router.navigateByUrl(`/tabs/detalhe-prato/${id}`);
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