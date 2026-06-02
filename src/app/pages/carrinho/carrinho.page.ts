import { Component } from '@angular/core';

@Component({
  selector: 'app-carrinho',
  templateUrl: './carrinho.page.html',
  styleUrls: ['./carrinho.page.scss'],
  standalone: false
})
export class CarrinhoPage {
  itens = [
    {
      nome: 'Bowl de tofu grelhado',
      quantidade: 1,
      preco: 17.5
    },
    {
      nome: 'Salada Caesar',
      quantidade: 1,
      preco: 8.9
    },
    {
      nome: 'Lasanha de beringela',
      quantidade: 1,
      preco: 14.5
    },
    {
      nome: 'Wrap de legumes',
      quantidade: 2,
      preco: 16.9
    }
  ];

  taxaEntrega = 2.5;

  get subtotal() {
    return this.itens.reduce((total, item) => {
      return total + item.preco * item.quantidade;
    }, 0);
  }

  get total() {
    return this.subtotal + this.taxaEntrega;
  }

  removerItem(index: number) {
    this.itens.splice(index, 1);
  }
}