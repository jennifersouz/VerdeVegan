import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AcompanharPedidoPageRoutingModule } from './acompanhar-pedido-routing.module';

import { AcompanharPedidoPage } from './acompanhar-pedido.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AcompanharPedidoPageRoutingModule
  ],
  declarations: [AcompanharPedidoPage]
})
export class AcompanharPedidoPageModule {}
