import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
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

      // Detalhe com tab bar
      {
        path: 'detalhe-prato/:id',
        loadChildren: () => import('../pages/detalhe-prato/detalhe-prato.module').then(m => m.DetalhePratoPageModule)
      },

      // Personalizar com tab bar
      {
        path: 'personalizar-prato/:id',
        loadChildren: () => import('../pages/personalizar-prato/personalizar-prato.module').then(m => m.PersonalizarPratoPageModule)
      },

      {
        path: '',
        redirectTo: '/tabs/inicio',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/inicio',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}