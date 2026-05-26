import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CheckoutMoradaPage } from './checkout-morada.page';

const routes: Routes = [
  {
    path: '',
    component: CheckoutMoradaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutMoradaPageRoutingModule {}
