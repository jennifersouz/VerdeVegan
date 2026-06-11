import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { HistoricoPedidosPageRoutingModule } from './historico-pedidos-routing.module';
import { HistoricoPedidosPage } from './historico-pedidos.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    HistoricoPedidosPageRoutingModule
  ],
  declarations: [HistoricoPedidosPage]
})
export class HistoricoPedidosPageModule {}
