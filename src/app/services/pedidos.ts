import { Injectable } from '@angular/core';

export interface Pedido {
  id: string;
  nome: string;
  data: string;
  hora: string;
  itens: number;
  estado: string;
  total: number;
  pagamento: string;
  morada: string;
}

@Injectable({
  providedIn: 'root',
})
export class Pedidos {
  private storageKey = 'verdevegan_pedidos';

  obterPedidos(): Pedido[] {
    const dados = localStorage.getItem(this.storageKey);

    if (!dados) {
      return [];
    }

    return JSON.parse(dados);
  }

  adicionarPedido(pedido: Pedido) {
    const pedidos = this.obterPedidos();
    pedidos.unshift(pedido);
    localStorage.setItem(this.storageKey, JSON.stringify(pedidos));
  }

  criarPedido(): Pedido {
    const agora = new Date();

    const novoPedido: Pedido = {
      id: '#VV' + Math.floor(10000 + Math.random() * 90000),
      nome: 'Bowl de tofu grelhado',
      data: 'Hoje',
      hora: agora.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      itens: 4,
      estado: 'A preparar',
      total: 58,
      pagamento: 'MB WAY',
      morada: 'Casa',
    };

    this.adicionarPedido(novoPedido);

    return novoPedido;
  }
}