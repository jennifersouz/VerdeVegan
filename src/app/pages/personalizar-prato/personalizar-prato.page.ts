import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MenuService,
  Prato,
  GrupoPersonalizacao,
  OpcaoPersonalizacao
} from '../../services/menu';
import { PerfilService } from '../../services/perfil';

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
    private perfilService: PerfilService
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
      this.selecoes[grupo.id] = [];
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
    const chaveCarrinho = perfil
      ? `verdevegan_carrinho_${perfil.email}`
      : 'verdevegan_carrinho_anonimo';

    const dadosGuardados = localStorage.getItem(chaveCarrinho);
    const itensGuardados = dadosGuardados ? JSON.parse(dadosGuardados) : [];

    itensGuardados.push(itemCarrinho);
    localStorage.setItem(chaveCarrinho, JSON.stringify(itensGuardados));
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));

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
