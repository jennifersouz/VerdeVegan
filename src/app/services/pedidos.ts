import { Injectable } from '@angular/core';

export interface Pedido {
  id: string;
  email?: string;
  nome: string;
  data: string;
  dataIso?: string;
  hora: string;
  itens: number;
  estado: string;
  total: number;
  pagamento: string;
  morada: string;
  artigos?: ArtigoPedido[];
  taxaEntrega?: number;
  moradaDetalhe?: string;
  pontosGanhos?: number;
  pontosUsados?: number;
  saldoPontos?: number;
  criadoEm?: string;
  estadoManual?: EstadoPedido;
  tempoConfirmacaoMinutos?: number;
  tempoPreparacaoMinutos?: number;
  tempoCaminhoMinutos?: number;
  tempoEntregaMinutos?: number;
  cancelamentoMinutos?: number;
  avaliado?: boolean;
  avaliacao?: number;
  comentarioAvaliacao?: string;
}

export interface ArtigoPedido {
  nome: string;
  quantidade: number;
  preco: number;
}

export type EstadoPedido = 'Recebido' | 'A preparar' | 'A caminho' | 'Entregue' | 'Cancelado';

@Injectable({
  providedIn: 'root',
})
export class Pedidos {
  private storageKey = 'verdevegan_pedidos';
  private readonly emailContaDefault = 'inesmpmarinho@gmail.com';
  private readonly emailContaDefaultAlternativo = 'inesmpmarainho@gmail.com';

  obterPedidos(email?: string): Pedido[] {
    const pedidos = this.garantirPedidosDefault();
    const emailNormalizado = email?.trim().toLowerCase();

    if (!emailNormalizado) {
      return pedidos;
    }

    return pedidos.filter((pedido: Pedido) => !pedido.email || pedido.email === emailNormalizado);
  }

  private garantirPedidosDefault(): Pedido[] {
    const dados = localStorage.getItem(this.storageKey);
    const pedidos: Pedido[] = dados ? JSON.parse(dados) : [];

    const pedidosBase = [
      ['#VV-1233', 'Lasanha de Beringela', 'Massas Caseiras, Bowl Garden · 03/06', '22H34', 2, 22.95, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-8444', 'Pizza Marguerita', 'Pizzaria Luzzo · 03/06', 'Agora', 1, 26.90, 'MB WAY', 'Casa', 'Cancelado'],
      ['#VV-7461', 'Bowl de Tofu Grelhado', 'Bowl Garden · 03/06', '22H34', 2, 16.60, 'Mastercard', 'Casa', 'Entregue'],
      ['#VV-3078', 'Bowl de Tofu Grelhado', 'Green Bowl Porto · 28/05', '22H34', 2, 16.20, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2048', 'Bowl de Tofu Grelhado', 'VerdeVegan · 22/05', '22H34', 2, 15.10, 'Mastercard', 'Casa', 'Entregue'],
      ['#VV-2006', 'Hambúrguer Verde', 'Jardim Vegan · 18/05', '22H34', 1, 9.80, 'MB WAY', 'Trabalho', 'Entregue'],
      ['#VV-2007', 'Wrap de legumes', 'Casa do Seitan · 09/04', '22H34', 3, 22.40, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2008', 'Lasanha de beringela', 'Horta Urbana · 25/03', '22H34', 2, 22.00, 'Mastercard', 'Casa', 'Entregue'],
      ['#VV-2009', 'Salada Caesar', 'VerdeVegan · 12/01', '22H34', 2, 18.30, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2010', 'Refeição familiar', 'Green Bowl Porto · 17/12', '22H34', 1, 66.00, 'Mastercard', 'Casa', 'Entregue'],
      ['#VV-2011', 'Carne estufada vegan', 'Jardim Vegan · 04/10', '22H34', 2, 19.70, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2012', 'Pizza vegan de cogumelos', 'Casa do Seitan · 20/07', '22H34', 3, 25.10, 'Mastercard', 'Trabalho', 'Entregue'],
      ['#VV-2013', 'Bowl de Tofu Grelhado', 'Horta Urbana · 11/02', '22H34', 2, 22.30, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2014', 'Wrap de legumes', 'VerdeVegan · 06/11', '22H34', 5, 44.75, 'Mastercard', 'Casa', 'Entregue'],
      ['#VV-2015', 'Refeição familiar', 'Green Bowl Porto · 25/03', '22H34', 1, 63.50, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2016', 'Caril de legumes', 'VerdeVegan · 18/02', '21H12', 2, 18.40, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2017', 'Tosta de abacate', 'Jardim Vegan · 07/12', '13H05', 1, 8.60, 'Mastercard', 'Trabalho', 'Entregue'],
      ['#VV-2018', 'Bowl de quinoa', 'Horta Urbana · 14/08', '20H18', 2, 17.90, 'MB WAY', 'Casa', 'Entregue'],
      ['#VV-2019', 'Massa com pesto vegan', 'Casa do Seitan · 02/05', '22H34', 3, 21.80, 'Mastercard', 'Casa', 'Entregue'],
      ['#VV-2020', 'Sopa do dia', 'VerdeVegan · 16/04', '12H44', 1, 6.40, 'MB WAY', 'Casa', 'Entregue']
    ] as const;

    const criarPedidosDefault = (email: string): Pedido[] => pedidosBase.map(pedido => ({
      id: email === this.emailContaDefault ? pedido[0] : `${pedido[0]}-A`,
      email,
      nome: pedido[1],
      data: pedido[2],
      hora: pedido[3],
      itens: pedido[4],
      estado: pedido[8],
      total: pedido[5],
      pagamento: pedido[6],
      morada: pedido[7],
      moradaDetalhe: pedido[7] === 'Casa'
        ? 'Rua das Flores, 12 · Viana do Castelo'
        : 'Rua do Trabalho, 8 · Viana do Castelo',
      taxaEntrega: 3.4,
      pontosGanhos: Math.floor(Number(pedido[5])),
      saldoPontos: 338,
      artigos: pedido[0] === '#VV-1233'
        ? [
            { nome: 'Lasanha de Beringela', quantidade: 1, preco: 15.75 },
            { nome: 'Smoothie Verde', quantidade: 1, preco: 3.8 }
          ]
        : [
            {
              nome: pedido[1],
              quantidade: Number(pedido[4]),
              preco: Math.max(0, Number(pedido[5]) - 3.4)
            }
          ]
    }));
    const pedidosDefault = [
      ...criarPedidosDefault(this.emailContaDefault),
      ...criarPedidosDefault(this.emailContaDefaultAlternativo)
    ];

    const idsPedidosDefault = pedidosDefault.map(pedido => pedido.id);
    const pedidosAtualizados = [
      ...pedidos.filter(pedido =>
        !idsPedidosDefault.includes(pedido.id) &&
        !/^#VV-15\d{2}(-A)?$/.test(pedido.id) &&
        !this.ePedidoCheesecakePreso(pedido)
      ),
      ...pedidosDefault
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(pedidosAtualizados));

    return pedidosAtualizados;
  }

  private ePedidoCheesecakePreso(pedido: Pedido): boolean {
    return pedido.nome.trim().toLowerCase() === 'cheesecake vegan' &&
      pedido.data === 'Hoje' &&
      pedido.hora === '17:45' &&
      pedido.itens === 3 &&
      Math.abs(pedido.total - 27.15) < 0.01;
  }

  adicionarPedido(pedido: Pedido) {
    const pedidos = this.obterPedidos();
    pedidos.unshift(pedido);
    localStorage.setItem(this.storageKey, JSON.stringify(pedidos));
  }

  obterPedidoPorId(id: string, email?: string): Pedido | undefined {
    const idNormalizado = id.startsWith('#') ? id : `#${id}`;

    return this.obterPedidos(email).find((pedido) => pedido.id === idNormalizado);
  }

  atualizarPedido(pedidoAtualizado: Pedido) {
    const pedidos = this.obterPedidos();
    const pedidosAtualizados = pedidos.map((pedido) =>
      pedido.id === pedidoAtualizado.id &&
        (!pedido.email || !pedidoAtualizado.email || pedido.email === pedidoAtualizado.email)
        ? pedidoAtualizado
        : pedido
    );

    localStorage.setItem(this.storageKey, JSON.stringify(pedidosAtualizados));
  }

  atualizarEstadoPedido(id: string, estado: EstadoPedido, email?: string) {
    const pedido = this.obterPedidoPorId(id, email);

    if (!pedido) {
      return;
    }

    this.atualizarPedido({
      ...pedido,
      estado,
      estadoManual: estado
    });
  }

  obterEstadoAtual(pedido: Pedido, agora = new Date()): EstadoPedido {
    if (pedido.estado === 'Cancelado' || pedido.estadoManual === 'Cancelado') {
      return 'Cancelado';
    }

    if (pedido.estadoManual === 'Entregue') {
      return pedido.estadoManual;
    }

    if (!pedido.criadoEm) {
      return pedido.estado as EstadoPedido;
    }

    const msDecorridos = agora.getTime() - new Date(pedido.criadoEm).getTime();
    const tempoConfirmacao = pedido.tempoConfirmacaoMinutos ?? 2;
    const tempoPreparacao = pedido.tempoPreparacaoMinutos ?? 2;
    const tempoEntrega = pedido.tempoEntregaMinutos ?? 6;

    if (msDecorridos >= tempoEntrega * 60000) {
      return 'Entregue';
    }

    if (msDecorridos >= (tempoConfirmacao + tempoPreparacao) * 60000) {
      return 'A caminho';
    }

    if (msDecorridos >= tempoConfirmacao * 60000) {
      return 'A preparar';
    }

    return 'Recebido';
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
      estado: 'Recebido',
      total: 58,
      pagamento: 'MB WAY',
      morada: 'Casa',
      criadoEm: agora.toISOString(),
      tempoConfirmacaoMinutos: 2,
      tempoPreparacaoMinutos: 2,
      tempoCaminhoMinutos: 2,
      tempoEntregaMinutos: 6,
      cancelamentoMinutos: 1,
    };

    this.adicionarPedido(novoPedido);

    return novoPedido;
  }
}
