import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export type EstadoPedido =
  | 'Recebido'
  | 'A preparar'
  | 'A caminho'
  | 'Entregue'
  | 'Cancelado';

export interface ItemPedido {
  nome: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: number;
  codigo: string;
  nome: string;
  data: string;
  hora: string;
  estado: EstadoPedido;
  restaurante: string;
  morada: string;
  pagamento: string;
  metodoPagamento: string;
  pontosGanhos: number;
  subtotal: number;
  taxaEntrega: number;
  desconto: number;
  total: number;
  itens: ItemPedido[];
  criadoEm: number;
  cancelavelAte: number;
  estimativaEntregaMinutos: number;
  estimativaEntregaEm: number;
  entregueEm?: number;
  avaliacao?: number;
  comentario?: string;
}

const PEDIDOS_MOCKADOS: Pedido[] = [
  {
    id: 1,
    codigo: '#VV-20240323-001',
    nome: 'Bowl de Tofu Grelhado',
    data: 'Ontem',
    hora: '22H34',
    estado: 'Recebido',
    restaurante: 'Bowl Garden',
    morada: 'Rua de Santa Catarina, 852 - Porto',
    pagamento: 'MB Way',
    metodoPagamento: 'MB Way',
    pontosGanhos: 18,
    subtotal: 18.80,
    taxaEntrega: 2.40,
    desconto: 0,
    total: 21.20,
    criadoEm: Date.now(),
    cancelavelAte: Date.now() + 45000,
    estimativaEntregaMinutos: 35,
    estimativaEntregaEm: Date.now() + 35 * 60 * 1000,
    itens: [
      { nome: 'Bowl de Tofu Grelhado', quantidade: 1, preco: 9.90 },
      { nome: 'Brownie de Cacau', quantidade: 1, preco: 4.80 },
      { nome: 'Sumo Laranja e Gengibre', quantidade: 1, preco: 4.10 }
    ]
  },
  {
    id: 2,
    codigo: '#VV-20240320-002',
    nome: 'Pizza Marguerita',
    data: '20 Mar',
    hora: '20H15',
    estado: 'Entregue',
    restaurante: 'Pizzaria Luzzo',
    morada: 'R. Manuel Pinto de Azevedo, 626 - Porto',
    pagamento: 'Mastercard *1234',
    metodoPagamento: 'Mastercard *1234',
    pontosGanhos: 24,
    subtotal: 27.70,
    taxaEntrega: 2.40,
    desconto: 1.20,
    total: 28.90,
    criadoEm: Date.now() - 86400000,
    cancelavelAte: Date.now() - 86400000,
    estimativaEntregaMinutos: 35,
    estimativaEntregaEm: Date.now() - 86400000 + 35 * 60 * 1000,
    itens: [
      { nome: 'Pizza Marguerita', quantidade: 1, preco: 24.50 },
      { nome: 'Limonada de Manjericão', quantidade: 1, preco: 3.20 }
    ],
    avaliacao: 0,
    comentario: ''
  }
];

@Injectable({
  providedIn: 'root'
})
export class Pedidos {

  private readonly CHAVE_PEDIDOS = 'verdevegan_pedidos_v2';
  private storageInicializado = false;
  private inicializadoComMockados = false;

  constructor(private storage: Storage) {}

  private async inicializarStorage(): Promise<void> {
    if (!this.storageInicializado) {
      await this.storage.create();
      this.storageInicializado = true;
    }
  }

  // ── Calcula estimativa de entrega com base nos itens ────────────────────
  private calcularEstimativaEntregaMinutos(itens: ItemPedido[]): number {
    const quantidadeTotal = itens.reduce((total, item) => total + item.quantidade, 0);
    if (quantidadeTotal <= 1) return 25;
    if (quantidadeTotal <= 3) return 35;
    return 45;
  }

  // ── Calcula o estado com base no tempo decorrido desde criadoEm ──────────
  private calcularEstadoAtual(pedido: Pedido): EstadoPedido {
    if (pedido.estado === 'Cancelado' || pedido.estado === 'Entregue') {
      return pedido.estado;
    }

    const agora = Date.now();
    const segundosPassados = Math.floor((agora - pedido.criadoEm) / 1000);

    if (segundosPassados >= 30) return 'Entregue';
    if (segundosPassados >= 20) return 'A caminho';
    if (segundosPassados >= 10) return 'A preparar';
    return 'Recebido';
  }

  public async obterPedidos(): Promise<Pedido[]> {
    await this.inicializarStorage();
    const guardados = await this.storage.get(this.CHAVE_PEDIDOS);

    let pedidosBase: Pedido[];

    if (guardados && Array.isArray(guardados) && guardados.length > 0) {
      pedidosBase = this.normalizarPedidos(guardados);
    } else if (!this.inicializadoComMockados) {
      this.inicializadoComMockados = true;
      pedidosBase = this.normalizarPedidos(PEDIDOS_MOCKADOS);
    } else {
      return [];
    }

    // Avançar estados com base no tempo real
    let houveAlteracao = false;
    const pedidosAtualizados = pedidosBase.map((pedido: Pedido) => {
      const estadoAtual = this.calcularEstadoAtual(pedido);
      if (pedido.estado !== estadoAtual) {
        houveAlteracao = true;
        return {
          ...pedido,
          estado: estadoAtual,
          entregueEm: estadoAtual === 'Entregue' ? (pedido.entregueEm ?? Date.now()) : pedido.entregueEm
        };
      }
      return pedido;
    });

    if (houveAlteracao) {
      await this.storage.set(this.CHAVE_PEDIDOS, pedidosAtualizados);
    } else if (!guardados || !Array.isArray(guardados) || guardados.length === 0) {
      // primeira inicialização com mockados
      await this.storage.set(this.CHAVE_PEDIDOS, pedidosAtualizados);
    }

    return pedidosAtualizados;
  }

  private async guardarPedidos(pedidos: Pedido[]): Promise<void> {
    await this.inicializarStorage();
    await this.storage.set(this.CHAVE_PEDIDOS, pedidos);
  }

  public async obterPedidoPorId(id: number): Promise<Pedido | null> {
    const pedidos = await this.obterPedidos();
    return pedidos.find((p: Pedido) => p.id === id) ?? null;
  }

  public async adicionarPedido(pedido: Pedido): Promise<Pedido> {
    const pedidos = await this.obterPedidos();
    const pedidoNormalizado = this.normalizarPedido(pedido);
    pedidos.unshift(pedidoNormalizado);
    await this.guardarPedidos(pedidos);
    return pedidoNormalizado;
  }

  public async atualizarEstadoPedido(id: number, estado: EstadoPedido): Promise<void> {
    const pedidos = await this.obterPedidos();
    const idx = pedidos.findIndex((p: Pedido) => p.id === id);

    if (idx !== -1) {
      pedidos[idx] = this.normalizarPedido({
        ...pedidos[idx],
        estado
      });
      await this.guardarPedidos(pedidos);
    }
  }

  public async cancelarPedido(id: number): Promise<void> {
    // Cancelamento directo no storage — sem passar por obterPedidos()
    // para evitar que o cálculo de tempo sobreponha o Cancelado
    await this.inicializarStorage();
    const guardados: Pedido[] = (await this.storage.get(this.CHAVE_PEDIDOS)) || [];
    const idx = guardados.findIndex((p: Pedido) => p.id === id);
    if (idx !== -1) {
      guardados[idx] = { ...guardados[idx], estado: 'Cancelado' };
      await this.storage.set(this.CHAVE_PEDIDOS, guardados);
    }
  }

  public async avaliarPedido(id: number, avaliacao: number, comentario: string): Promise<void> {
    await this.inicializarStorage();
    const guardados: Pedido[] = (await this.storage.get(this.CHAVE_PEDIDOS)) || [];
    const idx = guardados.findIndex((p: Pedido) => p.id === id);

    if (idx !== -1) {
      guardados[idx] = { ...guardados[idx], avaliacao, comentario };
      await this.storage.set(this.CHAVE_PEDIDOS, guardados);
    }
  }

  public adicionarPedidoSimples(pedidoSimples: {
    id: string;
    nome: string;
    data: string;
    hora: string;
    itens: number;
    estado: string;
    total: number;
    pagamento: string;
    morada: string;
  }): void {
    this.obterPedidos().then(pedidos => {
      const agora = Date.now();
      const taxaEntrega = 2.40;
      const subtotal = Math.max(0, pedidoSimples.total - taxaEntrega);
      const itensGerados = Array.from({ length: pedidoSimples.itens }, (_, i) => ({
        nome: i === 0 ? pedidoSimples.nome : `Item ${i + 1}`,
        quantidade: 1,
        preco: parseFloat((subtotal / pedidoSimples.itens).toFixed(2))
      }));
      const estimativaEntregaMinutos = this.calcularEstimativaEntregaMinutos(itensGerados);
      const pedidoCompleto: Pedido = {
        id: Date.now(),
        codigo: pedidoSimples.id,
        nome: pedidoSimples.nome,
        data: pedidoSimples.data,
        hora: pedidoSimples.hora,
        estado: 'Recebido',
        restaurante: 'VerdeVegan',
        morada: pedidoSimples.morada,
        pagamento: pedidoSimples.pagamento,
        metodoPagamento: pedidoSimples.pagamento,
        pontosGanhos: Math.floor(pedidoSimples.total) * 10,
        subtotal,
        taxaEntrega,
        desconto: 0,
        total: pedidoSimples.total,
        criadoEm: agora,
        cancelavelAte: agora + 45000,
        estimativaEntregaMinutos,
        estimativaEntregaEm: agora + estimativaEntregaMinutos * 60 * 1000,
        itens: itensGerados
      };

      pedidos.unshift(this.normalizarPedido(pedidoCompleto));
      this.guardarPedidos(pedidos);
    });
  }

  private normalizarPedidos(pedidos: Array<Pedido | any>): Pedido[] {
    return pedidos.map((pedido: any) => this.normalizarPedido(pedido));
  }

  private normalizarPedido(pedido: Pedido | any): Pedido {
    const agora = Date.now();
    const estado = this.normalizarEstado(pedido.estado);
    const itens: ItemPedido[] = Array.isArray(pedido.itens) ? pedido.itens : [];
    const subtotalItens = itens.reduce((acc: number, item: ItemPedido) => {
      return acc + (Number(item.preco) || 0) * (Number(item.quantidade) || 0);
    }, 0);
    const taxaEntrega = Number(pedido.taxaEntrega ?? 2.40);
    const subtotal = Number(pedido.subtotal ?? subtotalItens);
    const desconto = Number(pedido.desconto ?? 0);
    const total = Math.max(0, subtotal + taxaEntrega - desconto);
    const criadoEm = Number(pedido.criadoEm ?? agora);
    const cancelavelAte = Number(
      pedido.cancelavelAte ??
      (estado === 'Recebido' ? criadoEm + 45000 : criadoEm)
    );
    const metodoPagamento = pedido.metodoPagamento || pedido.pagamento || 'MB Way';
    // Estimativa de entrega — fallback para pedidos antigos sem o campo
    const estimativaEntregaMinutos = Number(pedido.estimativaEntregaMinutos || 35);
    const estimativaEntregaEm = Number(
      pedido.estimativaEntregaEm || criadoEm + estimativaEntregaMinutos * 60 * 1000
    );

    return {
      id: Number(pedido.id ?? Date.now()),
      codigo: pedido.codigo || pedido.id || '#VV',
      nome: pedido.nome || itens[0]?.nome || 'Pedido VerdeVegan',
      data: pedido.data || 'Hoje',
      hora: pedido.hora || '',
      estado,
      restaurante: pedido.restaurante || 'VerdeVegan',
      morada: pedido.morada || 'Morada de entrega',
      pagamento: pedido.pagamento || metodoPagamento,
      metodoPagamento,
      pontosGanhos: Number(pedido.pontosGanhos ?? Math.floor(total) * 10),
      subtotal,
      taxaEntrega,
      desconto,
      total,
      itens,
      criadoEm,
      cancelavelAte,
      estimativaEntregaMinutos,
      estimativaEntregaEm,
      entregueEm: pedido.entregueEm,
      avaliacao: pedido.avaliacao,
      comentario: pedido.comentario
    };
  }

  private normalizarEstado(estado: string): EstadoPedido {
    // Migração de nomes antigos
    if (estado === 'Em preparação' || estado === 'A preparar') {
      return 'A preparar';
    }

    if (
      estado === 'Recebido' ||
      estado === 'A caminho' ||
      estado === 'Entregue' ||
      estado === 'Cancelado'
    ) {
      return estado;
    }

    return 'Recebido';
  }
}
