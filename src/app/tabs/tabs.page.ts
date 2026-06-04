import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CarrinhoService } from '../services/carrinho';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit, OnDestroy {

  public menuAtivo = false;
  public totalArtigosCarrinho = 0;
  public quantidadeCarrinho = 0;

  private routerEventsSub?: Subscription;
  private readonly atualizarCarrinhoHandler = () => {
    this.ngZone.run(() => {
      this.atualizarTotalCarrinho();
    });
  };

  constructor(
    private router: Router,
    private carrinhoService: CarrinhoService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.atualizarTabAtiva(this.router.url);
    this.atualizarTotalCarrinho();

    window.addEventListener('verdevegan_carrinho_atualizado', this.atualizarCarrinhoHandler);

    this.routerEventsSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.atualizarTabAtiva(event.urlAfterRedirects);
        this.atualizarTotalCarrinho();
      });
  }

  ngOnDestroy() {
    window.removeEventListener('verdevegan_carrinho_atualizado', this.atualizarCarrinhoHandler);
    this.routerEventsSub?.unsubscribe();
  }

  private atualizarTabAtiva(url: string) {
    this.menuAtivo =
      url.startsWith('/tabs/menu') ||
      url.startsWith('/tabs/restaurante') ||
      url.startsWith('/tabs/detalhe-prato') ||
      url.startsWith('/tabs/personalizar-prato');
  }

  private async atualizarTotalCarrinho() {
    try {
      this.quantidadeCarrinho = await this.carrinhoService.contarArtigos();
      this.totalArtigosCarrinho = this.quantidadeCarrinho;
    } catch {
      this.quantidadeCarrinho = 0;
      this.totalArtigosCarrinho = 0;
    }
  }
}
