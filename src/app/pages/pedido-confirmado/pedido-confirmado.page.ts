import { Component, OnInit } from '@angular/core';
import { Pedido, Pedidos } from 'src/app/services/pedidos';
import { PerfilService } from 'src/app/services/perfil';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-pedido-confirmado',
  templateUrl: './pedido-confirmado.page.html',
  styleUrls: ['./pedido-confirmado.page.scss'],
  standalone: false
})
export class PedidoConfirmadoPage implements OnInit {
  pedido!: Pedido;
  numeroPedido = '';

  constructor(
    private pedidosService: Pedidos,
    private perfilService: PerfilService,
    private supabaseService: SupabaseService
  ) { }

  async ngOnInit() {
    this.pedido = this.pedidosService.criarPedido();
    this.numeroPedido = this.pedido.id;
    await this.guardarPedidoSupabase();
  }

  private async guardarPedidoSupabase() {
    const perfil = await this.perfilService.obterPerfil();

    if (!perfil) {
      return;
    }

    const { error } = await this.supabaseService.criarPedido({
      ...this.pedido,
      email: perfil.email
    });

    if (error) {
      console.error('Erro ao guardar pedido no Supabase:', error);
    }
  }
}
