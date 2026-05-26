import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PersonalizarPratoPage } from './personalizar-prato.page';

const routes: Routes = [
  {
    path: '',
    component: PersonalizarPratoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalizarPratoPageRoutingModule {}
