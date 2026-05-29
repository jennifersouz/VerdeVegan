import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  public categoriaSelecionada = 'Todas';

  constructor(
    private menuService: MenuService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarPratos();
  }

  private carregarPratos() {
    this.menuService.carregarPratos().subscribe({
      next: (pratos: Prato[]) => {
        this.pratos = pratos.filter((prato: Prato) => prato.destaque);
        this.pratosFiltrados = this.pratos;
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar pratos:', erro);
      }
    });
  }

  public selecionarCategoria(categoria: string) {
    this.categoriaSelecionada = categoria;
    this.filtrarPratos();
  }

  public filtrarPratos() {
    const pesquisa = this.termoPesquisa.trim().toLowerCase();

    this.pratosFiltrados = this.pratos.filter((prato: Prato) => {
      const correspondeCategoria =
        this.categoriaSelecionada === 'Todas' ||
        prato.categoria === this.categoriaSelecionada;

      const correspondePesquisa =
        prato.nome.toLowerCase().includes(pesquisa) ||
        prato.restaurante.toLowerCase().includes(pesquisa) ||
        prato.descricao.toLowerCase().includes(pesquisa);

      return correspondeCategoria && correspondePesquisa;
    });
  }

  public abrirDetalhe(id: number) {
    this.router.navigateByUrl(`/detalhe-prato/${id}`);
  }

  public terminarSessao() {
    this.router.navigateByUrl('/login');
  }

  public filtrosAberto = false;

  public filtroOrdenacao = 'Popular';
  public precoMaximo = 50;
  public avaliacaoMinima = 'Todas';

  public abrirFiltros() {
    this.filtrosAberto = true;
  }

  public fecharFiltros() {
    this.filtrosAberto = false;
  }

  public selecionarOrdenacao(valor: string) {
    this.filtroOrdenacao = valor;
  }

  public selecionarAvaliacao(valor: string) {
    this.avaliacaoMinima = valor;
  }

  public concluirFiltros() {
    console.log('Filtros aplicados:', {
      ordenacao: this.filtroOrdenacao,
      precoMaximo: this.precoMaximo,
      avaliacaoMinima: this.avaliacaoMinima
    });

    this.filtrosAberto = false;
  }
}