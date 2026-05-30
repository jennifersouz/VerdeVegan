import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonalizarPratoPageRoutingModule } from './personalizar-prato-routing.module';
import { PersonalizarPratoPage } from './personalizar-prato.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonalizarPratoPageRoutingModule
  ],
  declarations: [PersonalizarPratoPage]
})
export class PersonalizarPratoPageModule {}