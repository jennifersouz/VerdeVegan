import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InicioService } from '../../services/inicio';
import { Prato } from '../../services/menu';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false
})
export class InicioPage implements OnInit {

  public pratos: Prato[] = [];
  public pratosFiltrados: Prato[] = [];

  public termoPesquisa = '';
  public categoriaSelecionada = 'Todas';
  public filtrosAberto = false;

  public filtroOrdenacao = 'Popular';
  public precoMaximo = 50;
  public avaliacaoMinima = 'Todas';

  public carregando = true;
  public erroCarregamento = '';

  constructor(
    private inicioService: InicioService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.lerParametrosDaRota();
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
    const pesquisa = this.termoPesquisa.trim().toLowerCase();
    const avaliacaoMinima =
      this.avaliacaoMinima === 'Todas' ? 0 : Number(this.avaliacaoMinima);

    let pratosFiltrados = this.pratos.filter((prato: Prato) => {
      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        prato.categoria === this.categoriaSelecionada;

      const correspondePesquisa =
        prato.nome.toLowerCase().includes(pesquisa) ||
        prato.restaurante.toLowerCase().includes(pesquisa) ||
        prato.descricao.toLowerCase().includes(pesquisa);

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

  public abrirDetalhe(id: number) {
    this.router.navigateByUrl(`/tabs/detalhe-prato/${id}`);
  }

  public abrirMenuComCategoria(categoria: string) {
    this.router.navigateByUrl(
      `/tabs/menu?categoria=${encodeURIComponent(categoria)}`
    );
  }

  public pesquisarNoMenu() {
    const pesquisa = this.termoPesquisa.trim();

    if (pesquisa.length === 0) {
      return;
    }

    this.router.navigateByUrl(
      `/tabs/menu?pesquisa=${encodeURIComponent(pesquisa)}`
    );
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
}