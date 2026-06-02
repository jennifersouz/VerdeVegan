import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadChildren: () => import('./pages/splash/splash.module').then(m => m.SplashPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'registo',
    loadChildren: () => import('./pages/registo/registo.module').then(m => m.RegistoPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'editar-perfil',
    loadChildren: () => import('./pages/editar-perfil/editar-perfil.module').then( m => m.EditarPerfilPageModule)
  },
  {
    path: 'moradas',
    loadChildren: () => import('./pages/moradas/moradas.module').then( m => m.MoradasPageModule)
  },
  {
    path: 'pagamentos',
    loadChildren: () => import('./pages/pagamentos/pagamentos.module').then( m => m.PagamentosPageModule)
  },
        {
        path: 'personalizar-prato/:id',
        loadChildren: () => import('./pages/personalizar-prato/personalizar-prato.module').then(m => m.PersonalizarPratoPageModule)
      },
      {
        path: 'checkout-pontos',
        loadChildren: () => import('./pages/checkout-pontos/checkout-pontos.module').then(m => m.CheckoutPontosPageModule)
      },
      {
        path: 'checkout-morada',
        loadChildren: () => import('./pages/checkout-morada/checkout-morada.module').then(m => m.CheckoutMoradaPageModule)
      },
      {
        path: 'checkout-pagamento',
        loadChildren: () => import('./pages/checkout-pagamento/checkout-pagamento.module').then(m => m.CheckoutPagamentoPageModule)
      },
      {
        path: 'pedido-confirmado',
        loadChildren: () => import('./pages/pedido-confirmado/pedido-confirmado.module').then(m => m.PedidoConfirmadoPageModule)
      },
      {
        path: 'detalhe-pedido',
        loadChildren: () => import('./pages/detalhe-pedido/detalhe-pedido.module').then(m => m.DetalhePedidoPageModule)
      },
      {
        path: 'acompanhar-pedido',
        loadChildren: () => import('./pages/acompanhar-pedido/acompanhar-pedido.module').then(m => m.AcompanharPedidoPageModule)
      },
      {
        path: 'avaliacao',
        loadChildren: () => import('./pages/avaliacao/avaliacao.module').then(m => m.AvaliacaoPageModule)
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'pedido-confirmado',
        loadChildren: () => import('./pages/pedido-confirmado/pedido-confirmado.module').then(m => m.PedidoConfirmadoPageModule)
      },
      {
        path: 'detalhe-pedido',
        loadChildren: () => import('./pages/detalhe-pedido/detalhe-pedido.module').then(m => m.DetalhePedidoPageModule)
      }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}