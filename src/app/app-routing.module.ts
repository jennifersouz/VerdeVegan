import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'inicio',
    loadChildren: () => import('./pages/inicio/inicio.module').then( m => m.InicioPageModule)
  },
  {
    path: 'menu',
    loadChildren: () => import('./pages/menu/menu.module').then( m => m.MenuPageModule)
  },
  {
    path: 'detalhe-prato/:id',
    loadChildren: () => import('./pages/detalhe-prato/detalhe-prato.module').then( m => m.DetalhePratoPageModule)
  },
  {
    path: 'personalizar-prato',
    loadChildren: () => import('./pages/personalizar-prato/personalizar-prato.module').then( m => m.PersonalizarPratoPageModule)
  },
  {
    path: 'carrinho',
    loadChildren: () => import('./pages/carrinho/carrinho.module').then( m => m.CarrinhoPageModule)
  },
  {
    path: 'checkout-pontos',
    loadChildren: () => import('./pages/checkout-pontos/checkout-pontos.module').then( m => m.CheckoutPontosPageModule)
  },
  {
    path: 'checkout-morada',
    loadChildren: () => import('./pages/checkout-morada/checkout-morada.module').then( m => m.CheckoutMoradaPageModule)
  },
  {
    path: 'checkout-pagamento',
    loadChildren: () => import('./pages/checkout-pagamento/checkout-pagamento.module').then( m => m.CheckoutPagamentoPageModule)
  },
  {
    path: 'pedido-confirmado',
    loadChildren: () => import('./pages/pedido-confirmado/pedido-confirmado.module').then( m => m.PedidoConfirmadoPageModule)
  },
  {
    path: 'pedidos',
    loadChildren: () => import('./pages/pedidos/pedidos.module').then( m => m.PedidosPageModule)
  },
  {
    path: 'detalhe-pedido',
    loadChildren: () => import('./pages/detalhe-pedido/detalhe-pedido.module').then( m => m.DetalhePedidoPageModule)
  },
  {
    path: 'acompanhar-pedido',
    loadChildren: () => import('./pages/acompanhar-pedido/acompanhar-pedido.module').then( m => m.AcompanharPedidoPageModule)
  },
  {
    path: 'avaliacao',
    loadChildren: () => import('./pages/avaliacao/avaliacao.module').then( m => m.AvaliacaoPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then( m => m.PerfilPageModule)
  },
  {
    path: 'registo',
    loadChildren: () => import('./pages/registo/registo.module').then( m => m.RegistoPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
