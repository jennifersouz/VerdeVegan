import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { MenuService, Prato } from '../../services/menu';

interface RestauranteResumo {
  id: number;
  nome: string;
  categorias: string[];
  imagem: string;
  avaliacao: number;
  tempo: string;
  taxaEntrega: string;
  opcoes: number;
}

@Component({
  selector: 'app-restaurante',
  templateUrl: './restaurante.page.html',
  styleUrls: ['./restaurante.page.scss'],
  standalone: false
})
export class RestaurantePage implements OnInit {

  @ViewChild(IonContent) content?: IonContent;

  public restaurante?: RestauranteResumo;
  public pratosRestaurante: Prato[] = [];
  public categoriaAtiva = '';
  public carregando = true;
  public erroCarregamento = '';
  private categoriaBloqueadaAte = 0;
  public origem = 'inicio';
  public pratoOrigemId?: number;
  public detalheOrigem = 'menu';
  public detalheRestauranteId?: number;
  public pesquisaMenu = '';
  public tipoMenu = '';
  public categoriaMenu = '';

  private readonly restaurantes: RestauranteResumo[] = [
    {
      id: 6,
      nome: 'Pizzaria Luzzo',
      categorias: ['Entradas', 'Pizza', 'Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/pizzaria luzo.jpg',
      avaliacao: 4.6,
      tempo: '30-40min',
      taxaEntrega: '€2.40 entrega',
      opcoes: 5
    },
    {
      id: 7,
      nome: 'Massas Caseiras',
      categorias: ['Entradas', 'Massas', 'Sobremesas'],
      imagem: 'assets/imagens/massas caseiras .jpg',
      avaliacao: 4.7,
      tempo: '30-40min',
      taxaEntrega: '€1.90 entrega',
      opcoes: 6
    },
    {
      id: 20,
      nome: 'Green Burger Lab',
      categorias: ['Entradas', 'Pratos principais', 'Hambúrgueres', 'Sobremesas'],
      imagem: 'assets/imagens/green burguer lab.jpg',
      avaliacao: 4.6,
      tempo: '20-30min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 5
    },
    {
      id: 4,
      nome: 'Bowl Garden',
      categorias: ['Entradas', 'Bowls', 'Bebidas'],
      imagem: 'assets/imagens/bowl garden.jpg',
      avaliacao: 4.6,
      tempo: '25-35min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 5
    },
    {
      id: 21,
      nome: 'Taco Verde',
      categorias: ['Entradas', 'Tacos', 'Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/taco verde.jpg',
      avaliacao: 4.5,
      tempo: '20-30min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 5
    },
    {
      id: 12,
      nome: 'Sushi Raiz',
      categorias: ['Entradas', 'Sushi', 'Ramen', 'Sobremesas'],
      imagem: 'assets/imagens/sushi raiz.jpg',
      avaliacao: 4.6,
      tempo: '25-35min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4
    },
    {
      id: 1,
      nome: 'Doce Planta',
      categorias: ['Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/doce planta.jpg',
      avaliacao: 4.7,
      tempo: '15-25min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4
    },
    {
      id: 19,
      nome: 'Folha Fresca',
      categorias: ['Entradas', 'Wraps', 'Saladas', 'Bebidas'],
      imagem: 'assets/imagens/folha fresca.jpg',
      avaliacao: 4.5,
      tempo: '15-20min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4
    },
    {
      id: 9,
      nome: 'Brunch Verde',
      categorias: ['Entradas', 'Sobremesas', 'Bebidas'],
      imagem: 'assets/imagens/brunch verde.jpg',
      avaliacao: 4.5,
      tempo: '10-20min',
      taxaEntrega: '€1.50 entrega',
      opcoes: 4
    }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.carregarRestaurante();
  }

  private carregarRestaurante() {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    this.origem = this.activatedRoute.snapshot.queryParamMap.get('origem') || 'inicio';
    const pratoOrigemId = Number(this.activatedRoute.snapshot.queryParamMap.get('pratoId'));
    this.pratoOrigemId = pratoOrigemId > 0 ? pratoOrigemId : undefined;
    this.detalheOrigem = this.activatedRoute.snapshot.queryParamMap.get('detalheOrigem') || 'menu';

    const detalheRestauranteId = Number(this.activatedRoute.snapshot.queryParamMap.get('detalheRestauranteId'));
    this.detalheRestauranteId = detalheRestauranteId > 0 ? detalheRestauranteId : undefined;
    this.pesquisaMenu = this.activatedRoute.snapshot.queryParamMap.get('pesquisa') || '';
    this.tipoMenu = this.activatedRoute.snapshot.queryParamMap.get('tipo') || '';
    this.categoriaMenu = this.activatedRoute.snapshot.queryParamMap.get('categoria') || '';

    this.restaurante = this.restaurantes.find((restaurante) => restaurante.id === id);

    if (!this.restaurante) {
      this.router.navigateByUrl('/tabs/inicio');
      return;
    }

    this.carregando = true;
    this.erroCarregamento = '';

    this.menuService.carregarPratos().subscribe({
      next: (pratos: Prato[]) => {
        this.pratosRestaurante = pratos.filter(
          (prato: Prato) => prato.restaurante === this.restaurante?.nome
        );
        this.categoriaAtiva = this.obterCategorias()[0] || '';
        this.carregando = false;

        setTimeout(() => this.aoFazerScroll(), 0);
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar restaurante:', erro);
        this.erroCarregamento = 'Não foi possível carregar o restaurante. Atualize a página.';
        this.carregando = false;
      }
    });
  }

  public obterCategorias(): string[] {
    if (!this.restaurante) {
      return [];
    }

    return this.restaurante.categorias.filter(
      (categoria: string) => this.obterPratosPorCategoria(categoria).length > 0
    );
  }

  public obterPratosPorCategoria(categoria: string): Prato[] {
    return this.pratosRestaurante.filter((prato: Prato) => prato.categoria === categoria);
  }

  public async irParaCategoria(categoria: string) {
    this.categoriaAtiva = categoria;
    this.categoriaBloqueadaAte = Date.now() + 900;
    this.garantirCategoriaVisivel(categoria);

    const elemento = document.getElementById(this.obterCategoriaId(categoria));

    if (!elemento || !this.content) {
      elemento?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const elementoScroll = await this.content.getScrollElement();
    const destino =
      elemento.getBoundingClientRect().top -
      elementoScroll.getBoundingClientRect().top +
      elementoScroll.scrollTop -
      66;

    await this.content.scrollToPoint(0, Math.max(destino, 0), 420);
    this.categoriaAtiva = categoria;
    this.garantirCategoriaVisivel(categoria);
  }

  public async aoFazerScroll() {
    if (Date.now() < this.categoriaBloqueadaAte) {
      return;
    }

    const categorias = this.obterCategorias();

    if (categorias.length === 0) {
      return;
    }

    const elementoScroll = await this.content?.getScrollElement();

    if (elementoScroll) {
      const estaNoFim =
        elementoScroll.scrollTop + elementoScroll.clientHeight >= elementoScroll.scrollHeight - 12;

      if (estaNoFim) {
        const ultimaCategoria = categorias[categorias.length - 1];

        if (ultimaCategoria !== this.categoriaAtiva) {
          this.categoriaAtiva = ultimaCategoria;
          this.garantirCategoriaVisivel(ultimaCategoria);
        }

        return;
      }
    }

    let categoriaAtual = categorias[0];
    const limiteTituloVisivel = window.innerHeight - 170;

    categorias.forEach((categoria: string) => {
      const elemento = document.getElementById(this.obterCategoriaId(categoria));

      if (!elemento) {
        return;
      }

      const topo = elemento.getBoundingClientRect().top;

      if (topo <= limiteTituloVisivel) {
        categoriaAtual = categoria;
      }
    });

    if (categoriaAtual !== this.categoriaAtiva) {
      this.categoriaAtiva = categoriaAtual;
      this.garantirCategoriaVisivel(categoriaAtual);
    }
  }

  public obterCategoriaId(categoria: string): string {
    return `categoria-${categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
  }

  public abrirPrato(id: number) {
    this.router.navigateByUrl(
      `/tabs/detalhe-prato/${id}?origem=restaurante&restauranteId=${this.restaurante?.id}`
    );
  }

  public voltarInicio() {
    if (this.origem === 'detalhe' && this.pratoOrigemId) {
      this.router.navigateByUrl(this.obterUrlDetalheOrigem());
      return;
    }

    this.router.navigateByUrl('/tabs/inicio');
  }

  private garantirCategoriaVisivel(categoria: string) {
    window.requestAnimationFrame(() => {
      const botao = document.getElementById(this.obterBotaoCategoriaId(categoria));
      botao?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    });
  }

  public obterBotaoCategoriaId(categoria: string): string {
    return `botao-${this.obterCategoriaId(categoria)}`;
  }

  private obterUrlDetalheOrigem(): string {
    const params = new URLSearchParams();
    params.set('origem', this.detalheOrigem);

    if (this.detalheOrigem === 'restaurante' && this.detalheRestauranteId) {
      params.set('restauranteId', String(this.detalheRestauranteId));
    }

    if (this.pesquisaMenu) {
      params.set('pesquisa', this.pesquisaMenu);
    }

    if (this.tipoMenu) {
      params.set('tipo', this.tipoMenu);
    }

    if (this.categoriaMenu) {
      params.set('categoria', this.categoriaMenu);
    }

    return `/tabs/detalhe-prato/${this.pratoOrigemId}?${params.toString()}`;
  }
}
