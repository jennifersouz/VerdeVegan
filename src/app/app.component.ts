import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: false
})
export class AppComponent {

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.bloquearOrientacaoPortrait();
    this.configurarBotaoVoltarAndroid();
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

  private configurarBotaoVoltarAndroid() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const urlAtual = this.router.url.split('?')[0];

      if (urlAtual === '/splash') {
        this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
        return;
      }

      if (urlAtual === '/tabs/inicio' || !canGoBack) {
        CapacitorApp.exitApp();
        return;
      }

      this.location.back();
    });
  }
}
