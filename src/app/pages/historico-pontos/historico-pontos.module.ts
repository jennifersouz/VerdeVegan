import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { HistoricoPontosPageRoutingModule } from './historico-pontos-routing.module';
import { HistoricoPontosPage } from './historico-pontos.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    HistoricoPontosPageRoutingModule
  ],
  declarations: [HistoricoPontosPage]
})
export class HistoricoPontosPageModule {}
