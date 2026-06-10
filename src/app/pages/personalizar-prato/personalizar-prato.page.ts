import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MenuService,
  Prato,
  GrupoPersonalizacao,
  OpcaoPersonalizacao
} from '../../services/menu';
import { PerfilService } from '../../services/perfil';
import { Carrinho } from '../../services/carrinho';

@Component({
  selector: 'app-personalizar-prato',
  templateUrl: './personalizar-prato.page.html',
  styleUrls: ['./personalizar-prato.page.scss'],
  standalone: false
})
export class PersonalizarPratoPage implements OnInit {

  public prato?: Prato;

  public quantidade = 1;
  public observacoes = '';
  public origem = 'menu';
  public restauranteId?: number;

  public gruposPersonalizacao: GrupoPersonalizacao[] = [];

  public selecoes: { [grupoId: string]: OpcaoPersonalizacao[] } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private menuService: MenuService,
    private perfilService: PerfilService,
    private carrinhoService: Carrinho
  ) {}

  ngOnInit() {
    this.carregarPrato();
  }

  private carregarPrato() {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    const qtd = Number(this.activatedRoute.snapshot.queryParamMap.get('qtd'));
    this.origem = this.activatedRoute.snapshot.queryParamMap.get('origem') || 'menu';

    const restauranteId = Number(this.activatedRoute.snapshot.queryParamMap.get('restauranteId'));
    this.restauranteId = restauranteId > 0 ? restauranteId : undefined;

    this.quantidade = qtd > 0 ? qtd : 1;

    this.menuService.carregarPratos().subscribe({
      next: (pratos: Prato[]) => {
        this.prato = pratos.find((prato: Prato) => prato.id === id);

        if (!this.prato) {
          this.router.navigateByUrl('/tabs/menu');
          return;
        }

        if (!this.prato.personalizavel) {
          this.router.navigateByUrl(this.obterUrlDetalhe());
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

  private inicializarSelecoes() {
    this.gruposPersonalizacao.forEach((grupo: GrupoPersonalizacao) => {
      const opcaoInicial = grupo.opcoes.find((opcao: OpcaoPersonalizacao) => opcao.incluido)
        || (grupo.obrigatorio && !grupo.escolhaMultipla
          ? grupo.opcoes.find((opcao: OpcaoPersonalizacao) => opcao.preco === 0)
          : undefined);

      this.selecoes[grupo.id] = opcaoInicial ? [opcaoInicial] : [];
    });
  }

  public voltar() {
    if (this.prato) {
      this.router.navigateByUrl(this.obterUrlDetalhe());
      return;
    }

    this.router.navigateByUrl('/tabs/menu');
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
    } else {
      this.selecoes[grupo.id] = [...opcoesSelecionadas, opcao];
    }
  }

  public opcaoEstaSelecionada(grupo: GrupoPersonalizacao, opcao: OpcaoPersonalizacao): boolean {
    const opcoesSelecionadas = this.selecoes[grupo.id] || [];

    return opcoesSelecionadas.some(item => item.id === opcao.id);
  }

  public diminuirQuantidade() {
    if (this.quantidade > 1) {
      this.quantidade--;
    }
  }

  public aumentarQuantidade() {
    this.quantidade++;
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

  public calcularTotalUnidade(): number {
    if (!this.prato) {
      return 0;
    }

    return this.prato.preco + this.calcularPersonalizacoes();
  }

  public calcularTotalFinal(): number {
    return this.calcularTotalUnidade() * this.quantidade;
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

  public formularioValido(): boolean {
    return this.gruposPersonalizacao
      .filter((grupo: GrupoPersonalizacao) => grupo.obrigatorio)
      .every((grupo: GrupoPersonalizacao) => {
        const opcoesSelecionadas = this.selecoes[grupo.id] || [];
        return opcoesSelecionadas.length > 0;
      });
  }

  public async adicionarAoCarrinho() {
    if (!this.prato || !this.formularioValido()) {
      return;
    }

    const itemCarrinho = {
      nome: this.prato.nome,
      quantidade: this.quantidade,
      preco: this.calcularTotalUnidade()
    };

    const perfil = await this.perfilService.obterPerfil();
    this.carrinhoService.adicionarItem(itemCarrinho, perfil?.email);

    this.router.navigateByUrl('/tabs/carrinho');
  }

  private obterUrlDetalhe(): string {
    if (!this.prato) {
      return '/tabs/menu';
    }

    const parametrosOrigem = this.origem === 'restaurante' && this.restauranteId
      ? `?origem=restaurante&restauranteId=${this.restauranteId}`
      : '?origem=menu';

    return `/tabs/detalhe-prato/${this.prato.id}${parametrosOrigem}`;
  }
}
