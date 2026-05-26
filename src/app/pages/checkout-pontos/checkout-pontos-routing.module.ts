import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CheckoutPontosPage } from './checkout-pontos.page';

const routes: Routes = [
  {
    path: '',
    component: CheckoutPontosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutPontosPageRoutingModule {}
