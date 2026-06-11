import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AcompanharPedidoPage } from './acompanhar-pedido.page';

const routes: Routes = [
  {
    path: '',
    component: AcompanharPedidoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AcompanharPedidoPageRoutingModule {}
