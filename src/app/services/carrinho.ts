import { Injectable } from '@angular/core';

export interface ItemCarrinho {
  nome: string;
  quantidade: number;
  preco: number;
  restaurante?: string;
  tempo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Carrinho {
  private readonly chaveGuest = 'verdevegan_carrinho_guest';

  public obterItens(email?: string | null): ItemCarrinho[] {
    const dados = email
      ? localStorage.getItem(this.obterChaveUtilizador(email))
      : sessionStorage.getItem(this.chaveGuest);

    if (!dados) {
      return [];
    }

    try {
      return this.normalizarItens(JSON.parse(dados));
    } catch {
      return [];
    }
  }

  public guardarItens(itens: ItemCarrinho[], email?: string | null) {
    const itensNormalizados = this.normalizarItens(itens);

    if (email) {
      localStorage.setItem(this.obterChaveUtilizador(email), JSON.stringify(itensNormalizados));
    } else {
      sessionStorage.setItem(this.chaveGuest, JSON.stringify(itensNormalizados));
    }

    this.notificarAtualizacao();
  }

  public adicionarItem(item: ItemCarrinho, email?: string | null) {
    const itens = this.obterItens(email);
    itens.push(item);
    this.guardarItens(itens, email);
  }

  public limparCarrinho(email?: string | null) {
    if (email) {
      localStorage.removeItem(this.obterChaveUtilizador(email));
    } else {
      sessionStorage.removeItem(this.chaveGuest);
    }

    this.notificarAtualizacao();
  }

  public migrarGuestParaUtilizador(email: string) {
    const itensGuest = this.obterItens(null);

    if (itensGuest.length === 0) {
      return;
    }

    const itensUtilizador = this.obterItens(email);
    this.guardarItens([...itensUtilizador, ...itensGuest], email);
    sessionStorage.removeItem(this.chaveGuest);
    this.notificarAtualizacao();
  }

  private obterChaveUtilizador(email: string): string {
    return `verdevegan_carrinho_${email}`;
  }

  private normalizarItens(dados: unknown): ItemCarrinho[] {
    if (!Array.isArray(dados)) {
      return [];
    }

    return dados
      .map((item: any) => ({
        nome: item.nome || item.prato?.nome || 'Produto',
        quantidade: Number(item.quantidade) || 1,
        preco: Number(item.preco ?? item.totalUnidade ?? item.prato?.preco ?? 0),
        restaurante: item.restaurante || item.prato?.restaurante,
        tempo: item.tempo || item.prato?.tempo
      }))
      .filter((item: ItemCarrinho) => item.preco > 0);
  }

  private notificarAtualizacao() {
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }
}
