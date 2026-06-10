import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { SupabaseService } from './supabase';

export interface UtilizadorPerfil {
  nome: string;
  email: string;
  palavraPasse?: string;
  fotoPerfil?: string;
  telefone: string;
  morada: string;
  metodoPagamento: string;
  dieta: string;
  alergias: string;
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
  numero?: string;
  codigoPostal: string;
  cidade: string;
  localidade?: string;
  principal: boolean;
}

export interface MetodoPagamento {
  id: number;
  tipo: 'Visa' | 'Mastercard' | 'MB Way';
  titular: string;
  numeroCartao?: string;
  ultimosDigitos: string;
  validade: string;
  cvv?: string;
  principal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  private storageInicializado = false;
  private profileRealtimeUnsubscribe: (() => void) | null = null;
  private profileRealtimeEmail = '';

  private readonly EMAIL_CONTA_DEFAULT = 'inesmpmarinho@gmail.com';
  private readonly EMAILS_CONTA_DEFAULT = [
    'inesmpmarinho@gmail.com',
    'inesmpmarainho@gmail.com'
  ];
  private readonly PALAVRA_PASSE_DEFAULT = 'verdevegan';

  private readonly CHAVE_UTILIZADORES = 'utilizadores_perfil';
  private readonly CHAVE_EMAIL_ATUAL = 'email_utilizador_atual';
  private readonly CHAVE_HISTORICO_PONTOS = 'historico_pontos';
  private readonly CHAVE_MORADAS = 'moradas_entrega';
  private readonly CHAVE_PAGAMENTOS = 'metodos_pagamento';
  constructor(
    private storage: Storage,
    private supabaseService: SupabaseService
  ) {}

  private async inicializarStorage() {
    if (!this.storageInicializado) {
      await this.storage.create();
      this.storageInicializado = true;
      await this.garantirContaDefault();
    }
  }

  private async garantirContaDefault(): Promise<void> {
    const utilizadores = (await this.storage.get(this.CHAVE_UTILIZADORES)) || {};

    this.EMAILS_CONTA_DEFAULT.forEach(email => {
      const perfilExistente = utilizadores[email];
      const perfilDefault: UtilizadorPerfil = {
        nome: 'Inês Marinho',
        email,
        palavraPasse: this.PALAVRA_PASSE_DEFAULT,
        fotoPerfil: 'assets/imagens/IMG_2647.jpg',
        telefone: '912 345 678',
        morada: 'Rua de Santa Catarina, 852, Porto',
        metodoPagamento: 'MB WAY',
        dieta: 'Vegan',
        alergias: '',
        pontos: 153
      };

      utilizadores[email] = {
        ...perfilDefault,
        ...perfilExistente,
        nome: perfilExistente?.nome &&
          perfilExistente.nome !== 'inesmpmarinho' &&
          perfilExistente.nome !== 'inesmpmarainho'
          ? perfilExistente.nome
          : perfilDefault.nome,
        email,
        palavraPasse: this.PALAVRA_PASSE_DEFAULT,
        fotoPerfil: perfilExistente?.fotoPerfil || perfilDefault.fotoPerfil,
        pontos: perfilDefault.pontos
      };
    });

    await this.storage.set(this.CHAVE_UTILIZADORES, utilizadores);

    const historicoGuardado: HistoricoPontos[] =
      (await this.storage.get(this.CHAVE_HISTORICO_PONTOS)) || [];

    const movimentosHistorico = [
      { descricao: 'Acumulaste', pontos: 23, data: '2026-06-03' },
      { descricao: 'Acumulaste', pontos: 27, data: '2026-06-03' },
      { descricao: 'Acumulaste', pontos: 17, data: '2026-06-03' },
      { descricao: 'Acumulaste', pontos: 16, data: '2026-05-28' },
      { descricao: 'Acumulaste', pontos: 14, data: '2026-05-22' },
      { descricao: 'Acumulaste', pontos: 9, data: '2026-05-18' },
      { descricao: 'Redimidos', pontos: -20, data: '2026-05-18' },
      { descricao: 'Acumulaste', pontos: 22, data: '2026-04-09' },
      { descricao: 'Acumulaste', pontos: 20, data: '2026-03-25' },
      { descricao: 'Acumulaste', pontos: 18, data: '2026-01-12' },
      { descricao: 'Redimidos', pontos: -10, data: '2026-01-12' },
      { descricao: 'Acumulaste', pontos: 64, data: '2025-12-17' },
      { descricao: 'Acumulaste', pontos: 18, data: '2025-10-04' },
      { descricao: 'Acumulaste', pontos: 25, data: '2025-07-20' },
      { descricao: 'Redimidos', pontos: -30, data: '2025-07-20' },
      { descricao: 'Acumulaste', pontos: 20, data: '2025-02-11' },
      { descricao: 'Acumulaste', pontos: 42, data: '2024-11-06' },
      { descricao: 'Acumulaste', pontos: 64, data: '2024-03-25' }
    ];

    const historicoDefault: HistoricoPontos[] = this.EMAILS_CONTA_DEFAULT.reduce(
      (historico: HistoricoPontos[], email: string, emailIndex: number) => [
        ...historico,
        ...movimentosHistorico.map((movimento, movimentoIndex) => ({
          id: 900000 + emailIndex * 10000 - movimentoIndex,
          email,
          descricao: movimento.descricao,
          pontos: movimento.pontos,
          data: movimento.data
        }))
      ],
      []
    );

    const historicoAtualizado = [
      ...historicoGuardado.filter(item => !this.EMAILS_CONTA_DEFAULT.includes(item.email)),
      ...historicoDefault
    ];

    await this.storage.set(this.CHAVE_HISTORICO_PONTOS, historicoAtualizado);
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

  private async guardarPerfilLocal(perfil: UtilizadorPerfil): Promise<void> {
    const utilizadores = await this.obterTodosUtilizadores();
    utilizadores[this.normalizarEmail(perfil.email)] = {
      ...perfil,
      email: this.normalizarEmail(perfil.email)
    };
    await this.guardarTodosUtilizadores(utilizadores);
  }

  private async sincronizarPerfilRemoto(): Promise<UtilizadorPerfil | null> {
    const dadosRemotos = await this.supabaseService.obterPerfilAtual();

    if (!dadosRemotos) {
      return null;
    }

    await this.guardarPerfilLocal(dadosRemotos.perfil);
    await this.definirUtilizadorAtual(dadosRemotos.perfil.email);
    await this.guardarMoradasLocal(dadosRemotos.perfil.email, dadosRemotos.moradas);
    await this.guardarPagamentosLocal(dadosRemotos.perfil.email, dadosRemotos.pagamentos);
    await this.iniciarRealtimePerfil(dadosRemotos.perfil.email);

    return dadosRemotos.perfil;
  }

  private async guardarMoradasLocal(email: string, moradas: MoradaEntrega[]): Promise<void> {
    const todasMoradas = await this.storage.get(this.CHAVE_MORADAS) || {};
    todasMoradas[this.normalizarEmail(email)] = moradas;
    await this.storage.set(this.CHAVE_MORADAS, todasMoradas);
  }

  private async guardarPagamentosLocal(email: string, pagamentos: MetodoPagamento[]): Promise<void> {
    const todosPagamentos = await this.storage.get(this.CHAVE_PAGAMENTOS) || {};
    todosPagamentos[this.normalizarEmail(email)] = pagamentos;
    await this.storage.set(this.CHAVE_PAGAMENTOS, todosPagamentos);
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

  public async criarPerfilInicial(
    nome: string,
    email: string,
    palavraPasse?: string,
    dieta = '',
    alergias = ''
  ): Promise<UtilizadorPerfil> {
    const utilizadores = await this.obterTodosUtilizadores();
    const emailNormalizado = this.normalizarEmail(email);

    if (utilizadores[emailNormalizado]) {
      throw new Error('EMAIL_JA_EXISTE');
    }

    if (palavraPasse) {
      const { data, error } = await this.supabaseService.registarComEmail(emailNormalizado, palavraPasse, nome);

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('REGISTO_SUPABASE_INVALIDO');
      }
    }

    const perfil: UtilizadorPerfil = {
      nome: nome.trim(),
      email: emailNormalizado,
      telefone: '',
      morada: '',
      metodoPagamento: '',
      dieta,
      alergias,
      pontos: 0
    };

    utilizadores[emailNormalizado] = perfil;

    await this.guardarTodosUtilizadores(utilizadores);
    await this.definirUtilizadorAtual(emailNormalizado);
    await this.supabaseService.guardarPerfil(perfil);

    return perfil;
  }

  public async obterPerfil(): Promise<UtilizadorPerfil | null> {
    const perfilRemoto = await this.sincronizarPerfilRemoto();

    if (perfilRemoto) {
      return perfilRemoto;
    }

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
    await this.supabaseService.guardarPerfil({
      ...perfil,
      email: emailNovo
    });
  }

  public async iniciarSessao(email: string, palavraPasse?: string): Promise<UtilizadorPerfil> {
    const emailNormalizado = this.normalizarEmail(email);

    if (palavraPasse) {
      const { error } = await this.supabaseService.entrarComEmail(emailNormalizado, palavraPasse);

      if (error) {
        throw error;
      }
    }

    const perfilRemoto = await this.sincronizarPerfilRemoto();

    if (perfilRemoto) {
      return perfilRemoto;
    }

    const perfilExistente = await this.obterPerfilPorEmail(emailNormalizado);

    if (perfilExistente) {
      await this.definirUtilizadorAtual(emailNormalizado);
      await this.supabaseService.guardarPerfil(perfilExistente);
      return perfilExistente;
    }

    const nomeGerado = emailNormalizado.split('@')[0];
    return await this.criarPerfilInicial(nomeGerado, emailNormalizado);
  }

  public async recuperarPalavraPasse(email: string): Promise<void> {
    const emailNormalizado = this.normalizarEmail(email);
    const { error } = await this.supabaseService.recuperarPalavraPasse(emailNormalizado);

    if (error) {
      throw error;
    }
  }

  public async obterHistoricoPontos(): Promise<HistoricoPontos[]> {
    await this.inicializarStorage();

    const emailAtual = await this.obterEmailUtilizadorAtual();

    if (!emailAtual) {
      return [];
    }

    const historicoGuardado: HistoricoPontos[] =
      (await this.storage.get(this.CHAVE_HISTORICO_PONTOS)) || [];

    return historicoGuardado
      .filter((item: HistoricoPontos) => item.email === emailAtual)
      .sort((a: HistoricoPontos, b: HistoricoPontos) => {
        if (a.data === b.data) {
          return b.id - a.id;
        }

        return b.data.localeCompare(a.data);
      });
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
    await this.supabaseService.guardarPontos(perfil.pontos);

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
    this.pararRealtimePerfil();
    await this.supabaseService.terminarSessao();
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

  const dadosRemotos = await this.supabaseService.obterPerfilAtual();

  if (dadosRemotos) {
    await this.guardarMoradasLocal(dadosRemotos.perfil.email, dadosRemotos.moradas);
    return dadosRemotos.moradas;
  }

  const emailAtual = await this.obterEmailUtilizadorAtual();

  if (!emailAtual) {
    return [];
  }

  const todasMoradas = await this.storage.get(this.CHAVE_MORADAS) || {};

  if (todasMoradas[emailAtual]) {
    if (!this.temDadosDefault(emailAtual)) {
      const moradasSemDefaults = todasMoradas[emailAtual].filter(
        (morada: MoradaEntrega) => !this.eMoradaDefault(morada)
      );

      if (moradasSemDefaults.length !== todasMoradas[emailAtual].length) {
        todasMoradas[emailAtual] = moradasSemDefaults;
        await this.storage.set(this.CHAVE_MORADAS, todasMoradas);
      }

      return moradasSemDefaults;
    }

    return todasMoradas[emailAtual];
  }

  if (!this.temDadosDefault(emailAtual)) {
    todasMoradas[emailAtual] = [];
    await this.storage.set(this.CHAVE_MORADAS, todasMoradas);

    return [];
  }

  const moradasPadrao: MoradaEntrega[] = [
    {
      id: Date.now(),
      titulo: 'Casa',
      rua: 'Rua de Santa Catarina',
      numero: '852',
      codigoPostal: '4000-443',
      cidade: 'Porto',
      localidade: 'Porto',
      principal: true
    },
    {
      id: Date.now() + 1,
      titulo: 'Trabalho',
      rua: 'R. Manuel Pinto de Azevedo',
      numero: '626',
      codigoPostal: '4100-320',
      cidade: 'Porto',
      localidade: 'Porto',
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
  await this.supabaseService.guardarMoradas(moradas);
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

  const dadosRemotos = await this.supabaseService.obterPerfilAtual();

  if (dadosRemotos) {
    await this.guardarPagamentosLocal(dadosRemotos.perfil.email, dadosRemotos.pagamentos);
    return dadosRemotos.pagamentos;
  }

  const emailAtual = await this.obterEmailUtilizadorAtual();

  if (!emailAtual) {
    return [];
  }

  const todosPagamentos = await this.storage.get(this.CHAVE_PAGAMENTOS) || {};

  if (todosPagamentos[emailAtual]) {
    if (!this.temDadosDefault(emailAtual)) {
      const pagamentosSemDefaults = todosPagamentos[emailAtual].filter(
        (pagamento: MetodoPagamento) => !this.ePagamentoDefault(pagamento)
      );

      if (pagamentosSemDefaults.length !== todosPagamentos[emailAtual].length) {
        todosPagamentos[emailAtual] = pagamentosSemDefaults;
        await this.storage.set(this.CHAVE_PAGAMENTOS, todosPagamentos);
      }

      return pagamentosSemDefaults;
    }

    return todosPagamentos[emailAtual];
  }

  if (!this.temDadosDefault(emailAtual)) {
    todosPagamentos[emailAtual] = [];
    await this.storage.set(this.CHAVE_PAGAMENTOS, todosPagamentos);

    return [];
  }

  const perfilAtual = await this.obterPerfil();

const titularPadrao = perfilAtual?.nome || 'Utilizador VerdeVegan';

const pagamentosPadrao: MetodoPagamento[] = [
  {
    id: Date.now(),
    tipo: 'Mastercard',
    titular: titularPadrao,
    numeroCartao: '5555444433331234',
    ultimosDigitos: '1234',
    validade: '08/2028',
    cvv: '123',
    principal: true
  },
  {
    id: Date.now() + 1,
    tipo: 'Visa',
    titular: titularPadrao,
    numeroCartao: '4123456789011443',
    ultimosDigitos: '1443',
    validade: '12/2029',
    cvv: '456',
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
  await this.supabaseService.guardarPagamentos(pagamentos);
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

private temDadosDefault(email: string): boolean {
  return email === this.EMAIL_CONTA_DEFAULT;
}

private eMoradaDefault(morada: MoradaEntrega): boolean {
  return (
    morada.titulo === 'Casa' &&
    morada.rua === 'Rua de Santa Catarina' &&
    morada.numero === '852'
  ) || (
    morada.titulo === 'Trabalho' &&
    morada.rua === 'R. Manuel Pinto de Azevedo' &&
    morada.numero === '626'
  );
}

private ePagamentoDefault(pagamento: MetodoPagamento): boolean {
  return (
    pagamento.tipo === 'Mastercard' &&
    pagamento.ultimosDigitos === '1234'
  ) || (
    pagamento.tipo === 'Visa' &&
    pagamento.ultimosDigitos === '1443'
  );
}

private async iniciarRealtimePerfil(email: string): Promise<void> {
  if (!this.supabaseService.enabled || this.profileRealtimeEmail === email) {
    return;
  }

  this.pararRealtimePerfil();
  this.profileRealtimeEmail = email;
  this.profileRealtimeUnsubscribe = await this.supabaseService.subscribeToCurrentUserProfile(() => {
    void this.sincronizarPerfilRemoto();
  });
}

private pararRealtimePerfil(): void {
  this.profileRealtimeUnsubscribe?.();
  this.profileRealtimeUnsubscribe = null;
  this.profileRealtimeEmail = '';
}
}
