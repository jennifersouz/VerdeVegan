import { Component, OnInit } from '@angular/core';
import { MenuService, Prato } from 'src/app/services/menu';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detalhe-prato',
  templateUrl: './detalhe-prato.page.html',
  styleUrls: ['./detalhe-prato.page.scss'],
  standalone: false
})
export class DetalhePratoPage implements OnInit {

  public prato?: Prato;
  public quantidade = 1;
  public origem = 'menu';
  public restauranteId?: number;
  public pesquisaMenu = '';
  public tipoMenu = '';
  public categoriaMenu = '';

  private readonly restaurantes = [
    { id: 6, nome: 'Pizzaria Luzzo', imagem: 'assets/imagens/pizzaria luzo.jpg' },
    { id: 7, nome: 'Massas Caseiras', imagem: 'assets/imagens/massas caseiras .jpg' },
    { id: 20, nome: 'Green Burger Lab', imagem: 'assets/imagens/green burguer lab.jpg' },
    { id: 4, nome: 'Bowl Garden', imagem: 'assets/imagens/bowl garden.jpg' },
    { id: 21, nome: 'Taco Verde', imagem: 'assets/imagens/taco verde.jpg' },
    { id: 12, nome: 'Sushi Raiz', imagem: 'assets/imagens/sushi raiz.jpg' },
    { id: 1, nome: 'Doce Planta', imagem: 'assets/imagens/doce planta.jpg' },
    { id: 19, nome: 'Folha Fresca', imagem: 'assets/imagens/folha fresca.jpg' },
    { id: 9, nome: 'Brunch Verde', imagem: 'assets/imagens/brunch verde.jpg' }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private menuService: MenuService,
    private router: Router
  ) { }

  ngOnInit() {
    this.origem = this.activatedRoute.snapshot.queryParamMap.get('origem') || 'menu';
    const restauranteId = Number(this.activatedRoute.snapshot.queryParamMap.get('restauranteId'));
    this.restauranteId = restauranteId > 0 ? restauranteId : undefined;
    this.pesquisaMenu = this.activatedRoute.snapshot.queryParamMap.get('pesquisa') || '';
    this.tipoMenu = this.activatedRoute.snapshot.queryParamMap.get('tipo') || '';
    this.categoriaMenu = this.activatedRoute.snapshot.queryParamMap.get('categoria') || '';

    this.carregarDetalhesPrato();
  }

  private carregarDetalhesPrato() {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    this.menuService.carregarPratos().subscribe({
      next: (pratos: Prato[]) => {
        this.prato = pratos.find((p: Prato) => p.id === id);

        if (!this.prato) {
          console.error('Prato não encontrado.');
          this.router.navigateByUrl('/tabs/menu');
        }
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar prato:', erro);
        this.router.navigateByUrl('/tabs/menu');
      }
    });

  }

  public voltar() {
    if (this.origem === 'restaurante' && this.restauranteId) {
      this.router.navigateByUrl(`/tabs/restaurante/${this.restauranteId}`);
      return;
    }

    this.router.navigateByUrl(this.obterUrlMenu());
  }

  public diminuirQuantidade() {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  public aumentarQuantidade() {
    this.quantidade++;
  }

  public calcularTotal(): number {
    if (!this.prato) {
      return 0;
    }
    return this.prato.preco * this.quantidade;
  }

  public personalizar() {
  if (!this.prato) {
    return;
  }

  if (!this.prato.personalizavel) {
    console.log('Este prato não permite personalização.');
    return;
  }

  const parametrosOrigem = this.origem === 'restaurante' && this.restauranteId
    ? `&origem=restaurante&restauranteId=${this.restauranteId}`
    : '&origem=menu';

  this.router.navigateByUrl(`/tabs/personalizar-prato/${this.prato.id}?qtd=${this.quantidade}${parametrosOrigem}`);
}

  public obterImagemRestaurante(): string {
    if (!this.prato) {
      return '';
    }

    return this.restaurantes.find((restaurante) => restaurante.nome === this.prato?.restaurante)?.imagem || '';
  }

  public abrirRestaurante() {
    const restaurante = this.restaurantes.find((item) => item.nome === this.prato?.restaurante);

    if (!this.prato || !restaurante) {
      return;
    }

    const params = new URLSearchParams();
    params.set('origem', 'detalhe');
    params.set('pratoId', String(this.prato.id));
    params.set('detalheOrigem', this.origem);

    if (this.restauranteId) {
      params.set('detalheRestauranteId', String(this.restauranteId));
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

    this.router.navigateByUrl(`/tabs/restaurante/${restaurante.id}?${params.toString()}`);
  }

  private obterUrlMenu(): string {
    const params = new URLSearchParams();

    if (this.pesquisaMenu) {
      params.set('pesquisa', this.pesquisaMenu);
    }

    if (this.tipoMenu) {
      params.set('tipo', this.tipoMenu);
    }

    if (this.categoriaMenu) {
      params.set('categoria', this.categoriaMenu);
    }

    const query = params.toString();
    return query ? `/tabs/menu?${query}` : '/tabs/menu';
  }
}
