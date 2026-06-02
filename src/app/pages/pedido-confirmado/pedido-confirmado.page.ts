import { Component, OnInit } from '@angular/core';
import { Pedido, Pedidos } from 'src/app/services/pedidos';

@Component({
  selector: 'app-pedido-confirmado',
  templateUrl: './pedido-confirmado.page.html',
  styleUrls: ['./pedido-confirmado.page.scss'],
  standalone: false
})
export class PedidoConfirmadoPage implements OnInit {
  pedido!: Pedido;
  numeroPedido = '';

  constructor(private pedidosService: Pedidos) { }

  ngOnInit() {
    this.pedido = this.pedidosService.criarPedido();
    this.numeroPedido = this.pedido.id;
  }
}