import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CheckoutPagamentoPage } from './checkout-pagamento.page';

const routes: Routes = [
  {
    path: '',
    component: CheckoutPagamentoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutPagamentoPageRoutingModule {}
