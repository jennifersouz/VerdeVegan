import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadChildren: () => import('../pages/inicio/inicio.module').then(m => m.InicioPageModule)
      },
      {
        path: 'menu',
        loadChildren: () => import('../pages/menu/menu.module').then(m => m.MenuPageModule)
      },
      {
        path: 'carrinho',
        loadChildren: () => import('../pages/carrinho/carrinho.module').then(m => m.CarrinhoPageModule)
      },
      {
        path: 'pedidos',
        loadChildren: () => import('../pages/pedidos/pedidos.module').then(m => m.PedidosPageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('../pages/perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: 'editar-perfil',
        loadChildren: () => import('../pages/editar-perfil/editar-perfil.module').then(m => m.EditarPerfilPageModule)
      },
      {
      path: 'moradas',
      loadChildren: () => import('../pages/moradas/moradas.module').then(m => m.MoradasPageModule)
      },
      {
      path: 'pagamentos',
      loadChildren: () => import('../pages/pagamentos/pagamentos.module').then(m => m.PagamentosPageModule)
      },
      {
        path: 'detalhe-prato/:id',
        loadChildren: () => import('../pages/detalhe-prato/detalhe-prato.module').then(m => m.DetalhePratoPageModule)
      },
      {
        path: 'restaurante/:id',
        loadChildren: () => import('../pages/restaurante/restaurante.module').then(m => m.RestaurantePageModule)
      },
      {
        path: 'personalizar-prato/:id',
        loadChildren: () => import('../pages/personalizar-prato/personalizar-prato.module').then(m => m.PersonalizarPratoPageModule)
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
