import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DetalhePratoPageRoutingModule } from './detalhe-prato-routing.module';
import { DetalhePratoPage } from './detalhe-prato.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalhePratoPageRoutingModule
  ],
  declarations: [DetalhePratoPage]
})
export class DetalhePratoPageModule {}
