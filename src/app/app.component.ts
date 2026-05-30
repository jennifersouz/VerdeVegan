import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: false
})
export class AppComponent {

  constructor() {
    this.bloquearOrientacaoPortrait();
  }

  private async bloquearOrientacaoPortrait() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Bloqueio de orientação ignorado no browser.');
      return;
    }

    try {
      await ScreenOrientation.lock({
        orientation: 'portrait'
      });

      console.log('Orientação bloqueada em portrait.');
    } catch (erro) {
      console.error('Erro ao bloquear orientação:', erro);
    }
  }
}