import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoradasPageRoutingModule } from './moradas-routing.module';

import { MoradasPage } from './moradas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoradasPageRoutingModule
  ],
  declarations: [MoradasPage]
})
export class MoradasPageModule {}
