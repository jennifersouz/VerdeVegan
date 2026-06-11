import { TestBed } from '@angular/core/testing';

import { Pedidos } from './pedidos';

describe('Pedidos', () => {
  let service: Pedidos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pedidos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('keeps a timed order received before two minutes', () => {
    const criadoEm = new Date('2026-06-04T12:00:00.000Z');

    expect(service.obterEstadoAtual({
      id: '#VV-TEST',
      nome: 'Pedido teste',
      data: 'Hoje',
      hora: '12:00',
      itens: 1,
      estado: 'A preparar',
      total: 10,
      pagamento: 'MB WAY',
      morada: 'Casa',
      criadoEm: criadoEm.toISOString(),
      tempoConfirmacaoMinutos: 2,
      tempoPreparacaoMinutos: 2,
      tempoEntregaMinutos: 6
    }, new Date('2026-06-04T12:01:59.000Z'))).toBe('Recebido');
  });

  it('keeps a timed order preparing between two and four minutes', () => {
    const criadoEm = new Date('2026-06-04T12:00:00.000Z');

    expect(service.obterEstadoAtual({
      id: '#VV-TEST',
      nome: 'Pedido teste',
      data: 'Hoje',
      hora: '12:00',
      itens: 1,
      estado: 'A preparar',
      total: 10,
      pagamento: 'MB WAY',
      morada: 'Casa',
      criadoEm: criadoEm.toISOString(),
      tempoConfirmacaoMinutos: 2,
      tempoPreparacaoMinutos: 2,
      tempoEntregaMinutos: 6
    }, new Date('2026-06-04T12:03:00.000Z'))).toBe('A preparar');
  });

  it('moves a timed order to the road after confirmation and preparation', () => {
    const criadoEm = new Date('2026-06-04T12:00:00.000Z');

    expect(service.obterEstadoAtual({
      id: '#VV-TEST',
      nome: 'Pedido teste',
      data: 'Hoje',
      hora: '12:00',
      itens: 1,
      estado: 'Recebido',
      total: 10,
      pagamento: 'MB WAY',
      morada: 'Casa',
      criadoEm: criadoEm.toISOString(),
      tempoConfirmacaoMinutos: 2,
      tempoPreparacaoMinutos: 2,
      tempoEntregaMinutos: 6
    }, new Date('2026-06-04T12:04:30.000Z'))).toBe('A caminho');
  });

  it('auto-delivers a timed order after delivery time', () => {
    const criadoEm = new Date('2026-06-04T12:00:00.000Z');

    expect(service.obterEstadoAtual({
      id: '#VV-TEST',
      nome: 'Pedido teste',
      data: 'Hoje',
      hora: '12:00',
      itens: 1,
      estado: 'Recebido',
      total: 10,
      pagamento: 'MB WAY',
      morada: 'Casa',
      criadoEm: criadoEm.toISOString(),
      tempoConfirmacaoMinutos: 2,
      tempoPreparacaoMinutos: 2,
      tempoEntregaMinutos: 6
    }, new Date('2026-06-04T12:06:00.000Z'))).toBe('Entregue');
  });
});
