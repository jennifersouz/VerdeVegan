import { Injectable } from '@angular/core';
import { AuthChangeEvent, AuthError, createClient, RealtimeChannel, Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import type { Pedido } from './pedidos';
import type { HistoricoPontos, MetodoPagamento, MoradaEntrega, UtilizadorPerfil } from './perfil';

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  diet: string | null;
  allergies: string | null;
  photo_url: string | null;
  addresses: unknown;
  payments: unknown;
  points: number | null;
};

type OrderRow = {
  id: string;
  user_id: string;
  date: string;
  created_at_app: string | null;
  estimated_delivery_minutes: number | null;
  restaurant: string | null;
  status: string;
  items: unknown;
  points_used: number;
  points_earned: number;
  delivery_fee: number | null;
  total: number;
  rated: boolean;
  rating: number | null;
  review_comment: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private readonly pedidosDefaultRemovidos = new Set(['VV-3078']);
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );
  }

  public get enabled(): boolean {
    return Boolean(environment.supabase.url && environment.supabase.anonKey);
  }

  public onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): void {
    this.supabase.auth.onAuthStateChange(callback);
  }

  public async obterSessao(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  public async obterEmailUtilizadorAtual(): Promise<string | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user?.email?.trim().toLowerCase() || null;
  }

  public async entrarComEmail(email: string, palavraPasse: string) {
    return await this.supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: palavraPasse
    });
  }

  public async registarComEmail(email: string, palavraPasse: string, nome: string) {
    return await this.supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: palavraPasse,
      options: {
        data: {
          name: nome.trim()
        }
      }
    });
  }

  public async terminarSessao() {
    return await this.supabase.auth.signOut();
  }

  public async recuperarPalavraPasse(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login`
    });
  }

  public async guardarPerfil(perfil: UtilizadorPerfil, userId?: string) {
    const session = await this.obterSessao();
    const id = userId || session?.user.id;

    if (!id) {
      return { data: null, error: new AuthError('Utilizador não autenticado') };
    }

    const atual = await this.obterProfileRowAtual();

    return await this.supabase
      .from('profiles')
      .upsert({
        id,
        name: perfil.nome,
        email: perfil.email,
        phone: perfil.telefone || null,
        diet: perfil.dieta || null,
        allergies: perfil.alergias || null,
        photo_url: perfil.fotoPerfil || null,
        addresses: atual?.addresses || [],
        payments: atual?.payments || [],
        points: perfil.pontos || 0
      })
      .select()
      .single();
  }

  public async obterPerfilAtual(): Promise<{
    perfil: UtilizadorPerfil;
    moradas: MoradaEntrega[];
    pagamentos: MetodoPagamento[];
  } | null> {
    const row = await this.obterProfileRowAtual();

    if (!row) {
      return null;
    }

    return {
      perfil: this.profileRowParaPerfil(row),
      moradas: this.profileRowParaMoradas(row),
      pagamentos: this.profileRowParaPagamentos(row)
    };
  }

  public async guardarMoradas(moradas: MoradaEntrega[]) {
    return await this.atualizarProfileJson({ addresses: this.moradasParaProfileRow(moradas) });
  }

  public async guardarPagamentos(pagamentos: MetodoPagamento[]) {
    return await this.atualizarProfileJson({ payments: this.pagamentosParaProfileRow(pagamentos) });
  }

  public async guardarPontos(pontos: number) {
    return await this.atualizarProfileJson({ points: pontos });
  }

  public async criarPedido(pedido: Pedido) {
    const session = await this.obterSessao();

    if (!session) {
      return { data: null, error: new AuthError('Utilizador não autenticado') };
    }

    return await this.supabase
      .from('orders')
      .upsert([this.pedidoParaOrderRow(pedido, session.user.id)]);
  }

  public async atualizarEstadoPedido(id: string, estado: string) {
    const session = await this.obterSessao();

    if (!session) {
      return { data: null, error: new AuthError('Utilizador não autenticado') };
    }

    const idSemCardinal = id.trim().replace(/^#/, '');
    const idsPossiveis = [idSemCardinal, `#${idSemCardinal}`];

    return await this.supabase
      .from('orders')
      .update({ status: this.estadoParaSupabase(estado) })
      .eq('user_id', session.user.id)
      .in('id', idsPossiveis);
  }

  public async listarPedidos() {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at_app', { ascending: false });

    return {
      data: error
        ? null
        : (data as OrderRow[])
            .filter((row) => !this.pedidosDefaultRemovidos.has(row.id))
            .map((row) => this.orderRowParaPedido(row)),
      error
    };
  }

  public async listarHistoricoPontos(): Promise<HistoricoPontos[] | null> {
    const { data: userData } = await this.supabase.auth.getUser();
    const email = userData.user?.email?.trim().toLowerCase();

    if (!email) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('orders')
      .select('id, date, created_at_app, status, points_used, points_earned')
      .order('created_at_app', { ascending: false });

    if (error || !data) {
      return null;
    }

    const rows = data as Pick<OrderRow, 'id' | 'date' | 'created_at_app' | 'status' | 'points_used' | 'points_earned'>[];
    const historico: HistoricoPontos[] = [];

    rows
      .filter((row) => !this.pedidosDefaultRemovidos.has(row.id))
      .forEach((row, index) => {
        if (this.estadoParaMobile(row.status) === 'Entregue' && row.points_earned > 0) {
          historico.push({
            id: this.historicoId(row.id, index, 1),
            email,
            descricao: 'Acumulaste',
            pontos: row.points_earned,
            data: row.date,
            ordenadoEm: row.created_at_app || row.date
          });
        }

        if (row.points_used > 0) {
          historico.push({
            id: this.historicoId(row.id, index, 2),
            email,
            descricao: 'Redimidos',
            pontos: -row.points_used,
            data: row.date,
            ordenadoEm: row.created_at_app || row.date
          });
        }

        if (this.estadoParaMobile(row.status) === 'Cancelado' && row.points_used > 0) {
          historico.push({
            id: this.historicoId(row.id, index, 4),
            email,
            descricao: 'Devolução por cancelamento',
            pontos: row.points_used,
            data: row.date,
            ordenadoEm: row.created_at_app || row.date
          });
        }
      });

    return historico;
  }

  public async subscribeToCurrentUserOrders(callback: () => void): Promise<(() => void) | null> {
    const userId = await this.obterUserIdAtual();

    if (!userId) {
      return null;
    }

    const channel = this.supabase
      .channel(`orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return () => this.removerCanal(channel);
  }

  public async subscribeToCurrentUserProfile(callback: () => void): Promise<(() => void) | null> {
    const userId = await this.obterUserIdAtual();

    if (!userId) {
      return null;
    }

    const channel = this.supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return () => this.removerCanal(channel);
  }

  private async obterProfileRowAtual(): Promise<ProfileRow | null> {
    const userId = await this.obterUserIdAtual();

    if (!userId) {
      return null;
    }

    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();

    return data || null;
  }

  private async atualizarProfileJson(update: Partial<ProfileRow>) {
    const userId = await this.obterUserIdAtual();

    if (!userId) {
      return { data: null, error: new AuthError('Utilizador não autenticado') };
    }

    return await this.supabase
      .from('profiles')
      .update(update)
      .eq('id', userId);
  }

  private async obterUserIdAtual(): Promise<string | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user?.id || null;
  }

  private removerCanal(channel: RealtimeChannel): void {
    void this.supabase.removeChannel(channel);
  }

  private profileRowParaPerfil(row: ProfileRow): UtilizadorPerfil {
    const moradas = this.profileRowParaMoradas(row);
    const pagamentos = this.profileRowParaPagamentos(row);
    const moradaPrincipal = moradas.find((morada) => morada.principal) || moradas[0];
    const pagamentoPrincipal = pagamentos.find((pagamento) => pagamento.principal) || pagamentos[0];

    return {
      nome: row.name,
      email: row.email,
      fotoPerfil: row.photo_url || undefined,
      telefone: row.phone || '',
      morada: moradaPrincipal
        ? `${moradaPrincipal.rua}, ${moradaPrincipal.numero || ''}, ${moradaPrincipal.cidade}`.replace(/\s+,/g, ',').trim()
        : '',
      metodoPagamento: pagamentoPrincipal ? pagamentoPrincipal.tipo : '',
      dieta: row.diet || 'Vegan',
      alergias: row.allergies || '',
      pontos: row.points || 0
    };
  }

  private profileRowParaMoradas(row: ProfileRow): MoradaEntrega[] {
    if (!Array.isArray(row.addresses)) {
      return [];
    }

    return row.addresses.map((morada: any, index: number) => ({
      id: Number(morada.id || index + 1),
      titulo: String(morada.titulo || morada.label || 'Morada'),
      rua: String(morada.rua || morada.street || ''),
      numero: String(morada.numero || morada.number || ''),
      codigoPostal: String(morada.codigoPostal || morada.postalCode || ''),
      cidade: String(morada.cidade || morada.city || ''),
      localidade: String(morada.localidade || morada.locality || morada.city || ''),
      principal: Boolean(morada.principal)
    }));
  }

  private profileRowParaPagamentos(row: ProfileRow): MetodoPagamento[] {
    if (!Array.isArray(row.payments)) {
      return [];
    }

    return row.payments.map((pagamento: any, index: number) => {
      const numero = String(pagamento.numeroCartao || pagamento.number || '');
      const tipo = String(pagamento.tipo || pagamento.brand || 'Mastercard') as MetodoPagamento['tipo'];

      return {
        id: Number(pagamento.id || index + 1),
        tipo: tipo === 'Visa' ? 'Visa' : tipo === 'MB Way' ? 'MB Way' : 'Mastercard',
        titular: String(pagamento.titular || pagamento.holder || ''),
        numeroCartao: numero,
        ultimosDigitos: String(pagamento.ultimosDigitos || numero.slice(-4)),
        validade: String(pagamento.validade || pagamento.expiry || ''),
        cvv: String(pagamento.cvv || ''),
        principal: Boolean(pagamento.principal)
      };
    });
  }

  private moradasParaProfileRow(moradas: MoradaEntrega[]) {
    return moradas.map((morada) => ({
      id: morada.id,
      label: morada.titulo,
      street: morada.rua,
      number: morada.numero || '',
      postalCode: morada.codigoPostal,
      city: morada.cidade,
      locality: morada.localidade || morada.cidade,
      principal: morada.principal
    }));
  }

  private pagamentosParaProfileRow(pagamentos: MetodoPagamento[]) {
    return pagamentos.map((pagamento) => ({
      id: pagamento.id,
      holder: pagamento.titular,
      number: pagamento.numeroCartao || pagamento.ultimosDigitos,
      expiry: pagamento.validade,
      cvv: pagamento.cvv || '',
      brand: pagamento.tipo === 'Visa' ? 'Visa' : 'Mastercard',
      principal: pagamento.principal
    }));
  }

  private pedidoParaOrderRow(pedido: Pedido, userId: string): OrderRow {
    const data = pedido.criadoEm
      ? new Date(pedido.criadoEm).toISOString().slice(0, 10)
      : this.dataPedidoParaIso(pedido.data);

    return {
      id: pedido.id,
      user_id: userId,
      date: data,
      created_at_app: pedido.criadoEm || new Date().toISOString(),
      estimated_delivery_minutes: pedido.tempoEntregaMinutos || null,
      restaurant: pedido.moradaDetalhe || pedido.morada || null,
      status: this.estadoParaSupabase(pedido.estado),
      items: (pedido.artigos || []).map((artigo, index) => ({
        dishId: `${pedido.id}-${index}`,
        name: artigo.nome,
        quantity: artigo.quantidade,
        price: artigo.preco,
        extras: []
      })),
      points_used: pedido.pontosUsados || 0,
      points_earned: pedido.pontosGanhos || 0,
      delivery_fee: pedido.taxaEntrega || null,
      total: pedido.total,
      rated: !!pedido.avaliado,
      rating: pedido.avaliacao || null,
      review_comment: pedido.comentarioAvaliacao || null
    };
  }

  private orderRowParaPedido(row: OrderRow): Pedido {
    const estadoBase = this.estadoParaMobile(row.status);
    const pedidoAntigo = row.date < new Date().toISOString().slice(0, 10);
    const estado = pedidoAntigo && estadoBase !== 'Cancelado' ? 'Entregue' : estadoBase;
    const criadoEm = pedidoAntigo ? undefined : row.created_at_app || new Date().toISOString();
    const artigos = Array.isArray(row.items)
      ? row.items.map((item: any) => ({
          nome: String(item.nome || item.name || 'Artigo'),
          quantidade: Number(item.quantidade || item.quantity || 1),
          preco: Number(item.preco || item.price || 0)
        }))
      : [];

    return {
      id: row.id,
      nome: artigos[0]?.nome || 'Pedido VerdeVegan',
      data: this.formatarDataPedido(row.date),
      dataIso: row.date,
      hora: criadoEm
        ? new Date(criadoEm).toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '',
      itens: artigos.reduce((total, artigo) => total + artigo.quantidade, 0),
      estado,
      total: Number(row.total),
      pagamento: '',
      morada: row.restaurant || '',
      artigos,
      taxaEntrega: row.delivery_fee || undefined,
      pontosGanhos: row.points_earned,
      pontosUsados: row.points_used,
      criadoEm,
      tempoEntregaMinutos: row.estimated_delivery_minutes || undefined,
      avaliado: row.rated,
      avaliacao: row.rating || undefined,
      comentarioAvaliacao: row.review_comment || undefined
    };
  }

  private estadoParaSupabase(estado: string): string {
    return estado === 'A preparar' ? 'Em preparação' : estado;
  }

  private estadoParaMobile(estado: string): string {
    return estado === 'Em preparação' ? 'A preparar' : estado;
  }

  private dataPedidoParaIso(data: string): string {
    if (data.toLowerCase().includes('hoje')) {
      return new Date().toISOString().slice(0, 10);
    }

    const partes = data.match(/(\d{2})\/(\d{2})/);

    if (partes) {
      return `${new Date().getFullYear()}-${partes[2]}-${partes[1]}`;
    }

    return new Date().toISOString().slice(0, 10);
  }

  private formatarDataPedido(data: string): string {
    const partes = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!partes) {
      return data;
    }

    return `${partes[3]}/${partes[2]}`;
  }

  private historicoId(id: string, index: number, tipo: number): number {
    return Math.abs(
      id.split('').reduce((total, char) => total + char.charCodeAt(0), 0) * 100 +
      index * 10 +
      tipo
    );
  }
}
