import { Component, OnInit } from '@angular/core';
import {
  GrupoPersonalizacao,
  MenuService,
  OpcaoPersonalizacao,
  Prato
} from 'src/app/services/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { PerfilService } from 'src/app/services/perfil';
import { Carrinho } from 'src/app/services/carrinho';

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
  public modalPersonalizacaoAberto = false;
  public observacoes = '';
  public gruposPersonalizacao: GrupoPersonalizacao[] = [];
  public selecoes: { [grupoId: string]: OpcaoPersonalizacao[] } = {};

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
    private router: Router,
    private perfilService: PerfilService,
    private carrinhoService: Carrinho
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
          return;
        }

        this.gruposPersonalizacao = this.prato.personalizacoes || [];
        this.inicializarSelecoes();
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

    this.modalPersonalizacaoAberto = true;
  }

  public fecharPersonalizacao() {
    this.modalPersonalizacaoAberto = false;
  }

  public selecionarOpcao(grupo: GrupoPersonalizacao, opcao: OpcaoPersonalizacao) {
    if (grupo.escolhaMultipla) {
      this.alternarOpcaoMultipla(grupo, opcao);
      return;
    }

    this.selecoes[grupo.id] = [opcao];
  }

  private alternarOpcaoMultipla(grupo: GrupoPersonalizacao, opcao: OpcaoPersonalizacao) {
    const opcoesSelecionadas = this.selecoes[grupo.id] || [];
    const jaExiste = opcoesSelecionadas.some(item => item.id === opcao.id);

    if (jaExiste) {
      this.selecoes[grupo.id] = opcoesSelecionadas.filter(item => item.id !== opcao.id);
      return;
    }

    this.selecoes[grupo.id] = [...opcoesSelecionadas, opcao];
  }

  public opcaoEstaSelecionada(grupo: GrupoPersonalizacao, opcao: OpcaoPersonalizacao): boolean {
    const opcoesSelecionadas = this.selecoes[grupo.id] || [];
    return opcoesSelecionadas.some(item => item.id === opcao.id);
  }

  public calcularPersonalizacoes(): number {
    let total = 0;

    Object.values(this.selecoes).forEach((opcoes: OpcaoPersonalizacao[]) => {
      opcoes.forEach((opcao: OpcaoPersonalizacao) => {
        total += opcao.preco;
      });
    });

    return total;
  }

  public calcularTotalUnidadePersonalizado(): number {
    if (!this.prato) {
      return 0;
    }

    return this.prato.preco + this.calcularPersonalizacoes();
  }

  public calcularTotalFinalPersonalizado(): number {
    return this.calcularTotalUnidadePersonalizado() * this.quantidade;
  }

  public formatarPreco(valor: number): string {
    return `€${valor.toFixed(2)}`;
  }

  public formatarPrecoOpcao(opcao: OpcaoPersonalizacao): string {
    if (opcao.incluido && opcao.preco === 0) {
      return 'Incluído';
    }

    if (opcao.preco === 0) {
      return 'Sem custo';
    }

    const prefixo = opcao.preco > 0 ? '+' : '-';
    return `${prefixo}€${Math.abs(opcao.preco).toFixed(2)}`;
  }

  public formularioPersonalizacaoValido(): boolean {
    return this.gruposPersonalizacao
      .filter((grupo: GrupoPersonalizacao) => grupo.obrigatorio)
      .every((grupo: GrupoPersonalizacao) => {
        const opcoesSelecionadas = this.selecoes[grupo.id] || [];
        return opcoesSelecionadas.length > 0;
      });
  }

  public async adicionarPersonalizadoAoCarrinho() {
    if (!this.prato || !this.formularioPersonalizacaoValido()) {
      return;
    }

    const itemCarrinho = {
      nome: this.prato.nome,
      quantidade: this.quantidade,
      preco: this.calcularTotalUnidadePersonalizado()
    };

    const perfil = await this.perfilService.obterPerfil();
    this.carrinhoService.adicionarItem(itemCarrinho, perfil?.email);

    this.modalPersonalizacaoAberto = false;
    this.router.navigateByUrl('/tabs/carrinho');
  }

  private inicializarSelecoes() {
    this.selecoes = {};

    this.gruposPersonalizacao.forEach((grupo: GrupoPersonalizacao) => {
      const opcaoInicial = grupo.opcoes.find((opcao: OpcaoPersonalizacao) => opcao.incluido)
        || (grupo.obrigatorio && !grupo.escolhaMultipla
          ? grupo.opcoes.find((opcao: OpcaoPersonalizacao) => opcao.preco === 0)
          : undefined);

      this.selecoes[grupo.id] = opcaoInicial ? [opcaoInicial] : [];
    });
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
