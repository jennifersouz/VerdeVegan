import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CheckoutMoradaPageRoutingModule } from './checkout-morada-routing.module';

import { CheckoutMoradaPage } from './checkout-morada.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CheckoutMoradaPageRoutingModule
  ],
  declarations: [CheckoutMoradaPage]
})
export class CheckoutMoradaPageModule {}
