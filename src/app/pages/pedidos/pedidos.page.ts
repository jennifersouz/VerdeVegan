import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Pedido {
  id: number;
  estado: string;
  data: string;
  total: number;
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage {

  public pedidos: Pedido[] = [];

  constructor(private router: Router) {}

  public irParaMenu() {
    this.router.navigateByUrl('/tabs/menu');
  }

  public abrirPedido(id: number) {
    this.router.navigateByUrl(`/tabs/detalhe-pedido/${id}`);
  }
}