import { Component } from '@angular/core';

@Component({
  selector: 'app-checkout-morada',
  templateUrl: './checkout-morada.page.html',
  styleUrls: ['./checkout-morada.page.scss'],
  standalone: false,
})
export class CheckoutMoradaPage {
  moradaSelecionada = 'casa';

  selecionarMorada(morada: string) {
    this.moradaSelecionada = morada;
  }
}