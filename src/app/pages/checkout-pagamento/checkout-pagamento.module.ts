import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CheckoutPagamentoPageRoutingModule } from './checkout-pagamento-routing.module';

import { CheckoutPagamentoPage } from './checkout-pagamento.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CheckoutPagamentoPageRoutingModule
  ],
  declarations: [CheckoutPagamentoPage]
})
export class CheckoutPagamentoPageModule {}
