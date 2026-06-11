import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricoPontosPage } from './historico-pontos.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricoPontosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricoPontosPageRoutingModule {}
