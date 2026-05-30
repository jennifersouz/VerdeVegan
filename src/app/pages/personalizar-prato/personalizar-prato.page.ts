import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MenuService,
  Prato,
  GrupoPersonalizacao,
  OpcaoPersonalizacao
} from '../../services/menu';

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

  public gruposPersonalizacao: GrupoPersonalizacao[] = [];

  public selecoes: { [grupoId: string]: OpcaoPersonalizacao[] } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private menuService: MenuService
  ) {}

  ngOnInit() {
    this.carregarPrato();
  }

  private carregarPrato() {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    const qtd = Number(this.activatedRoute.snapshot.queryParamMap.get('qtd'));

    this.quantidade = qtd > 0 ? qtd : 1;

    this.menuService.carregarPratos().subscribe({
      next: (pratos: Prato[]) => {
        this.prato = pratos.find((prato: Prato) => prato.id === id);

        if (!this.prato) {
          this.router.navigateByUrl('/tabs/menu');
          return;
        }

        if (!this.prato.personalizavel) {
          this.router.navigateByUrl(`/tabs/detalhe-prato/${this.prato.id}`);
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
      this.selecoes[grupo.id] = [];
    });
  }

  public voltar() {
    if (this.prato) {
      this.router.navigateByUrl(`/tabs/detalhe-prato/${this.prato.id}`);
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

  public formularioValido(): boolean {
    return this.gruposPersonalizacao
      .filter((grupo: GrupoPersonalizacao) => grupo.obrigatorio)
      .every((grupo: GrupoPersonalizacao) => {
        const opcoesSelecionadas = this.selecoes[grupo.id] || [];
        return opcoesSelecionadas.length > 0;
      });
  }

  public adicionarAoCarrinho() {
    if (!this.prato || !this.formularioValido()) {
      return;
    }

    const itemCarrinho = {
      prato: this.prato,
      quantidade: this.quantidade,
      selecoes: this.selecoes,
      observacoes: this.observacoes,
      totalUnidade: this.calcularTotalUnidade(),
      totalFinal: this.calcularTotalFinal()
    };

    console.log('Item adicionado ao carrinho:', itemCarrinho);

    this.router.navigateByUrl('/tabs/carrinho');
  }
}