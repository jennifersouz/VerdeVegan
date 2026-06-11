import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoradasPage } from './moradas.page';

const routes: Routes = [
  {
    path: '',
    component: MoradasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoradasPageRoutingModule {}
