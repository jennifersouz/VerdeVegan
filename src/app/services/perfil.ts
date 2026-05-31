import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface UtilizadorPerfil {
  nome: string;
  email: string;
  telefone: string;
  morada: string;
  metodoPagamento: string;
  pontos: number;
}

export interface HistoricoPontos {
  id: number;
  email: string;
  descricao: string;
  pontos: number;
  data: string;
}

export interface MoradaEntrega {
  id: number;
  titulo: string;
  rua: string;
  codigoPostal: string;
  cidade: string;
  principal: boolean;
}

export interface MetodoPagamento {
  id: number;
  tipo: 'Visa' | 'Mastercard' | 'MB Way';
  titular: string;
  ultimosDigitos: string;
  validade: string;
  principal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  private storageInicializado = false;

  private readonly CHAVE_UTILIZADORES = 'utilizadores_perfil';
  private readonly CHAVE_EMAIL_ATUAL = 'email_utilizador_atual';
  private readonly CHAVE_HISTORICO_PONTOS = 'historico_pontos';
  private readonly CHAVE_MORADAS = 'moradas_entrega';
  private readonly CHAVE_PAGAMENTOS = 'metodos_pagamento';
  constructor(private storage: Storage) {}

  private async inicializarStorage() {
    if (!this.storageInicializado) {
      await this.storage.create();
      this.storageInicializado = true;
    }
  }

  private normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async obterTodosUtilizadores(): Promise<{ [email: string]: UtilizadorPerfil }> {
    await this.inicializarStorage();
    const utilizadores = await this.storage.get(this.CHAVE_UTILIZADORES);
    return utilizadores || {};
  }

  private async guardarTodosUtilizadores(utilizadores: { [email: string]: UtilizadorPerfil }): Promise<void> {
    await this.inicializarStorage();
    await this.storage.set(this.CHAVE_UTILIZADORES, utilizadores);
  }

  public async definirUtilizadorAtual(email: string): Promise<void> {
    await this.inicializarStorage();
    const emailNormalizado = this.normalizarEmail(email);
    await this.storage.set(this.CHAVE_EMAIL_ATUAL, emailNormalizado);
  }

  public async obterEmailUtilizadorAtual(): Promise<string | null> {
    await this.inicializarStorage();
    return await this.storage.get(this.CHAVE_EMAIL_ATUAL);
  }

  public async existePerfil(email: string): Promise<boolean> {
    const utilizadores = await this.obterTodosUtilizadores();
    const emailNormalizado = this.normalizarEmail(email);
    return !!utilizadores[emailNormalizado];
  }

  public async criarPerfilInicial(nome: string, email: string): Promise<UtilizadorPerfil> {
    const utilizadores = await this.obterTodosUtilizadores();
    const emailNormalizado = this.normalizarEmail(email);

    const perfil: UtilizadorPerfil = {
      nome: nome.trim(),
      email: emailNormalizado,
      telefone: '',
      morada: '',
      metodoPagamento: '',
      pontos: 0
    };

    utilizadores[emailNormalizado] = perfil;

    await this.guardarTodosUtilizadores(utilizadores);
    await this.definirUtilizadorAtual(emailNormalizado);

    return perfil;
  }

  public async obterPerfil(): Promise<UtilizadorPerfil | null> {
    const emailAtual = await this.obterEmailUtilizadorAtual();

    if (!emailAtual) {
      return null;
    }

    const utilizadores = await this.obterTodosUtilizadores();
    return utilizadores[emailAtual] || null;
  }

  public async obterPerfilPorEmail(email: string): Promise<UtilizadorPerfil | null> {
    const utilizadores = await this.obterTodosUtilizadores();
    const emailNormalizado = this.normalizarEmail(email);
    return utilizadores[emailNormalizado] || null;
  }

  public async atualizarPerfil(perfil: UtilizadorPerfil): Promise<void> {
    // Usar o email atual como chave de escrita (não o email editado,
    // que pode ter mudado) para não perder o registo do utilizador.
    const emailAtual = await this.obterEmailUtilizadorAtual();
    const utilizadores = await this.obterTodosUtilizadores();

    const chaveEscrita = emailAtual
      ? this.normalizarEmail(emailAtual)
      : this.normalizarEmail(perfil.email);

    // Se o email foi alterado, migrar a entrada para a nova chave
    // e remover a antiga.
    const emailNovo = this.normalizarEmail(perfil.email);

    if (emailAtual && emailAtual !== emailNovo) {
      delete utilizadores[emailAtual];
    }

    utilizadores[emailNovo] = {
      ...perfil,
      email: emailNovo
    };

    await this.guardarTodosUtilizadores(utilizadores);
    await this.definirUtilizadorAtual(emailNovo);
  }

  public async iniciarSessao(email: string): Promise<UtilizadorPerfil> {
    const emailNormalizado = this.normalizarEmail(email);
    const perfilExistente = await this.obterPerfilPorEmail(emailNormalizado);

    if (perfilExistente) {
      await this.definirUtilizadorAtual(emailNormalizado);
      return perfilExistente;
    }

    const nomeGerado = emailNormalizado.split('@')[0];
    return await this.criarPerfilInicial(nomeGerado, emailNormalizado);
  }

  public async obterHistoricoPontos(): Promise<HistoricoPontos[]> {
    await this.inicializarStorage();

    const emailAtual = await this.obterEmailUtilizadorAtual();

    if (!emailAtual) {
      return [];
    }

    const historicoGuardado: HistoricoPontos[] =
      (await this.storage.get(this.CHAVE_HISTORICO_PONTOS)) || [];

    return historicoGuardado.filter((item: HistoricoPontos) => item.email === emailAtual);
  }

  public async adicionarPontos(descricao: string, pontos: number): Promise<void> {
    await this.inicializarStorage();

    const emailAtual = await this.obterEmailUtilizadorAtual();

    if (!emailAtual) {
      return;
    }

    const utilizadores = await this.obterTodosUtilizadores();
    const perfil = utilizadores[emailAtual];

    if (!perfil) {
      return;
    }

    perfil.pontos += pontos;
    utilizadores[emailAtual] = perfil;

    await this.guardarTodosUtilizadores(utilizadores);

    const historicoGuardado: HistoricoPontos[] =
      (await this.storage.get(this.CHAVE_HISTORICO_PONTOS)) || [];

    const novoItem: HistoricoPontos = {
      id: Date.now(),
      email: emailAtual,
      descricao,
      pontos,
      data: new Date().toISOString().split('T')[0]
    };

    historicoGuardado.unshift(novoItem);

    await this.storage.set(this.CHAVE_HISTORICO_PONTOS, historicoGuardado);
  }

  public async terminarSessao(): Promise<void> {
    await this.inicializarStorage();
    await this.storage.remove(this.CHAVE_EMAIL_ATUAL);
  }

  public gerarIniciais(nome: string): string {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      return 'U';
    }

    const partesNome = nomeLimpo.split(' ');

    if (partesNome.length === 1) {
      return partesNome[0].substring(0, 2).toUpperCase();
    }

    const primeiraInicial = partesNome[0].charAt(0);
    const ultimaInicial = partesNome[partesNome.length - 1].charAt(0);

    return `${primeiraInicial}${ultimaInicial}`.toUpperCase();
  }

  public async obterMoradas(): Promise<MoradaEntrega[]> {
  await this.inicializarStorage();

  const emailAtual = await this.obterEmailUtilizadorAtual();

  if (!emailAtual) {
    return [];
  }

  const todasMoradas = await this.storage.get(this.CHAVE_MORADAS) || {};

  if (todasMoradas[emailAtual]) {
    return todasMoradas[emailAtual];
  }

  const moradasPadrao: MoradaEntrega[] = [
    {
      id: Date.now(),
      titulo: 'Casa',
      rua: 'Rua de Santa Catarina, 852',
      codigoPostal: '4000-443',
      cidade: 'Porto',
      principal: true
    },
    {
      id: Date.now() + 1,
      titulo: 'Trabalho',
      rua: 'R. Manuel Pinto de Azevedo, 626',
      codigoPostal: '4100-320',
      cidade: 'Porto',
      principal: false
    }
  ];

  todasMoradas[emailAtual] = moradasPadrao;

  await this.storage.set(this.CHAVE_MORADAS, todasMoradas);

  return moradasPadrao;
}

public async guardarMoradas(moradas: MoradaEntrega[]): Promise<void> {
  await this.inicializarStorage();

  const emailAtual = await this.obterEmailUtilizadorAtual();

  if (!emailAtual) {
    return;
  }

  const todasMoradas = await this.storage.get(this.CHAVE_MORADAS) || {};

  todasMoradas[emailAtual] = moradas;

  await this.storage.set(this.CHAVE_MORADAS, todasMoradas);
}

public async adicionarMorada(morada: MoradaEntrega): Promise<void> {
  const moradas = await this.obterMoradas();

  if (morada.principal) {
    moradas.forEach((item: MoradaEntrega) => item.principal = false);
  }

  moradas.push(morada);

  await this.guardarMoradas(moradas);
}

public async removerMorada(id: number): Promise<void> {
  const moradas = await this.obterMoradas();

  const moradasAtualizadas = moradas.filter((morada: MoradaEntrega) => morada.id !== id);

  if (
    moradasAtualizadas.length > 0 &&
    !moradasAtualizadas.some((morada: MoradaEntrega) => morada.principal)
  ) {
    moradasAtualizadas[0].principal = true;
  }

  await this.guardarMoradas(moradasAtualizadas);
}

public async definirMoradaPrincipal(id: number): Promise<void> {
  const moradas = await this.obterMoradas();

  moradas.forEach((morada: MoradaEntrega) => {
    morada.principal = morada.id === id;
  });

  await this.guardarMoradas(moradas);
}

public async obterMetodosPagamento(): Promise<MetodoPagamento[]> {
  await this.inicializarStorage();

  const emailAtual = await this.obterEmailUtilizadorAtual();

  if (!emailAtual) {
    return [];
  }

  const todosPagamentos = await this.storage.get(this.CHAVE_PAGAMENTOS) || {};

  if (todosPagamentos[emailAtual]) {
    return todosPagamentos[emailAtual];
  }

  const perfilAtual = await this.obterPerfil();

const titularPadrao = perfilAtual?.nome || 'Utilizador VerdeVegan';

const pagamentosPadrao: MetodoPagamento[] = [
  {
    id: Date.now(),
    tipo: 'Mastercard',
    titular: titularPadrao,
    ultimosDigitos: '1234',
    validade: '08/2028',
    principal: true
  },
  {
    id: Date.now() + 1,
    tipo: 'Visa',
    titular: titularPadrao,
    ultimosDigitos: '1443',
    validade: '12/2029',
    principal: false
  }
];

  todosPagamentos[emailAtual] = pagamentosPadrao;

  await this.storage.set(this.CHAVE_PAGAMENTOS, todosPagamentos);

  return pagamentosPadrao;
}

public async guardarMetodosPagamento(pagamentos: MetodoPagamento[]): Promise<void> {
  await this.inicializarStorage();

  const emailAtual = await this.obterEmailUtilizadorAtual();

  if (!emailAtual) {
    return;
  }

  const todosPagamentos = await this.storage.get(this.CHAVE_PAGAMENTOS) || {};

  todosPagamentos[emailAtual] = pagamentos;

  await this.storage.set(this.CHAVE_PAGAMENTOS, todosPagamentos);
}

public async adicionarMetodoPagamento(pagamento: MetodoPagamento): Promise<void> {
  const pagamentos = await this.obterMetodosPagamento();

  if (pagamento.principal) {
    pagamentos.forEach((item: MetodoPagamento) => item.principal = false);
  }

  pagamentos.push(pagamento);

  await this.guardarMetodosPagamento(pagamentos);
}

public async removerMetodoPagamento(id: number): Promise<void> {
  const pagamentos = await this.obterMetodosPagamento();

  const pagamentosAtualizados = pagamentos.filter((pagamento: MetodoPagamento) => pagamento.id !== id);

  if (
    pagamentosAtualizados.length > 0 &&
    !pagamentosAtualizados.some((pagamento: MetodoPagamento) => pagamento.principal)
  ) {
    pagamentosAtualizados[0].principal = true;
  }

  await this.guardarMetodosPagamento(pagamentosAtualizados);
}

public async definirPagamentoPrincipal(id: number): Promise<void> {
  const pagamentos = await this.obterMetodosPagamento();

  pagamentos.forEach((pagamento: MetodoPagamento) => {
    pagamento.principal = pagamento.id === id;
  });

  await this.guardarMetodosPagamento(pagamentos);
}
}
