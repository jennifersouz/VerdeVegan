import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: false,
})
export class AboutPage {
  minimum = [
    '3 tarefas implementadas: efetuar pedido, personalizar refeição, repetir pedido com pontos e avaliação.',
    'Angular Router com Router e ActivatedRoute.',
    'Parâmetros entre páginas: detalhes/:id, pedido/:id e avaliar/:id.',
    'Ionic Components e ícones Ionicons.',
    'Services para menu, carrinho, encomendas, storage, strings, dispositivo e API externa.',
    'Ionic Storage para carrinho, pontos e histórico.',
    'Ficheiros JSON para menu, encomendas iniciais e strings.',
    'Capacitor Screen Orientation para bloquear portrait em dispositivo físico.',
    'CSS Custom Properties e formatação global.',
    'Reactive Forms no login, registo, checkout e avaliação.',
  ];
}
