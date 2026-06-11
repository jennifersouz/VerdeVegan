import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetalhePratoPage } from './detalhe-prato.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhePratoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalhePratoPageRoutingModule {}
