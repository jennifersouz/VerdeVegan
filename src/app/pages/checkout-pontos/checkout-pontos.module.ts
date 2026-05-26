import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CheckoutPontosPageRoutingModule } from './checkout-pontos-routing.module';

import { CheckoutPontosPage } from './checkout-pontos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CheckoutPontosPageRoutingModule
  ],
  declarations: [CheckoutPontosPage]
})
export class CheckoutPontosPageModule {}
