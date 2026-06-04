import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { PerfilService } from './perfil';
import { Prato } from './menu';

export interface ItemCarrinho {
  id: number;
  prato: Prato;
  quantidade: number;
  selecoes: any;
  observacoes: string;
  totalUnidade: number;
  totalFinal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {

  private storageInicializado = false;

  private readonly CHAVE_CARRINHO_GUEST = 'carrinho_guest';
  private readonly PREFIXO_CARRINHO_USER = 'carrinho_user_';

  constructor(
    private storage: Storage,
    private perfilService: PerfilService
  ) {}

  private async inicializarStorage(): Promise<void> {
    if (!this.storageInicializado) {
      await this.storage.create();
      this.storageInicializado = true;
    }
  }

  private async obterChaveCarrinhoAtual(): Promise<string> {
    await this.inicializarStorage();
    const emailAtual = await this.perfilService.obterEmailUtilizadorAtual();
    if (!emailAtual) {
      return this.CHAVE_CARRINHO_GUEST;
    }
    return `${this.PREFIXO_CARRINHO_USER}${emailAtual}`;
  }

  public async obterItens(): Promise<ItemCarrinho[]> {
    await this.inicializarStorage();
    const chave = await this.obterChaveCarrinhoAtual();
    return (await this.storage.get(chave)) || [];
  }

  public async guardarItens(itens: ItemCarrinho[]): Promise<void> {
    await this.inicializarStorage();
    const chave = await this.obterChaveCarrinhoAtual();
    await this.storage.set(chave, itens);
  }

  public async adicionarItem(item: ItemCarrinho): Promise<void> {
    const itens = await this.obterItens();
    itens.push({ ...item, id: Date.now() });
    await this.guardarItens(itens);
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }

  public async removerItem(id: number): Promise<void> {
    const itens = await this.obterItens();
    const itensAtualizados = itens.filter((item: ItemCarrinho) => item.id !== id);
    await this.guardarItens(itensAtualizados);
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }

  public async atualizarQuantidade(id: number, quantidade: number): Promise<void> {
    const itens = await this.obterItens();
    const itensAtualizados = itens.map((item: ItemCarrinho) => {
      if (item.id !== id) return item;
      const novaQtd = Math.max(1, quantidade);
      return {
        ...item,
        quantidade: novaQtd,
        totalFinal: item.totalUnidade * novaQtd
      };
    });
    await this.guardarItens(itensAtualizados);
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }

  public async limparCarrinho(): Promise<void> {
    await this.guardarItens([]);
    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }

  public async calcularTotal(): Promise<number> {
    const itens = await this.obterItens();
    return itens.reduce((total: number, item: ItemCarrinho) => {
      return total + item.totalFinal;
    }, 0);
  }

  public async contarArtigos(): Promise<number> {
    const itens = await this.obterItens();
    return itens.reduce((total: number, item: ItemCarrinho) => {
      return total + item.quantidade;
    }, 0);
  }

  public async migrarCarrinhoGuestParaUtilizador(): Promise<void> {
    await this.inicializarStorage();
    const emailAtual = await this.perfilService.obterEmailUtilizadorAtual();

    if (!emailAtual) {
      return;
    }

    const chaveUser = `${this.PREFIXO_CARRINHO_USER}${emailAtual}`;

    const itensGuest: ItemCarrinho[] =
      (await this.storage.get(this.CHAVE_CARRINHO_GUEST)) || [];

    if (itensGuest.length === 0) {
      return;
    }

    const itensUser: ItemCarrinho[] =
      (await this.storage.get(chaveUser)) || [];

    const itensCombinados = [...itensUser, ...itensGuest];

    await this.storage.set(chaveUser, itensCombinados);
    await this.storage.remove(this.CHAVE_CARRINHO_GUEST);

    window.dispatchEvent(new Event('verdevegan_carrinho_atualizado'));
  }
}
