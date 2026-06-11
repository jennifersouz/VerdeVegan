import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PerfilService } from '../services/perfil';
import { Carrinho } from '../services/carrinho';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnDestroy {

  public menuAtivo = false;
  public totalArtigosCarrinho = 0;

  private readonly atualizarCarrinhoHandler = () => this.atualizarTotalCarrinho();

  constructor(
    private router: Router,
    private perfilService: PerfilService,
    private carrinhoService: Carrinho
  ) {
    this.atualizarTabAtiva(this.router.url);
    this.atualizarTotalCarrinho();
    window.addEventListener('verdevegan_carrinho_atualizado', this.atualizarCarrinhoHandler);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.atualizarTabAtiva(event.urlAfterRedirects);
        this.atualizarTotalCarrinho();
      });
  }

  ngOnDestroy() {
    window.removeEventListener('verdevegan_carrinho_atualizado', this.atualizarCarrinhoHandler);
  }

  private atualizarTabAtiva(url: string) {
    this.menuAtivo =
      url.startsWith('/tabs/menu') ||
      url.startsWith('/tabs/restaurante') ||
      url.startsWith('/tabs/detalhe-prato') ||
      url.startsWith('/tabs/personalizar-prato');
  }

  private async atualizarTotalCarrinho() {
    const perfil = await this.perfilService.obterPerfil();
    const itens = this.carrinhoService.obterItens(perfil?.email);

    this.totalArtigosCarrinho = itens.reduce((total: number, item) => {
      return total + (Number(item.quantidade) || 1);
    }, 0);
  }

}
