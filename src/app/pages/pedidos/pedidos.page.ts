import { Component, OnInit } from '@angular/core';
import { Pedido, Pedidos } from 'src/app/services/pedidos';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: false
})
export class PedidosPage implements OnInit {
  pedidos: Pedido[] = [];

  constructor(private pedidosService: Pedidos) { }

  ngOnInit() {
    this.carregarPedidos();
  }

  ionViewWillEnter() {
    this.carregarPedidos();
  }

  carregarPedidos() {
    this.pedidos = this.pedidosService.obterPedidos();
  }
}