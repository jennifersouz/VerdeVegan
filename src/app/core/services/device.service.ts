import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

/** Controla comportamento nativo do dispositivo através do Capacitor. */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  async lockPortrait(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch {
      // Em alguns emuladores o bloqueio pode não estar disponível.
    }
  }
}
