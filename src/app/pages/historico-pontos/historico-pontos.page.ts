import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HistoricoPontos, PerfilService } from '../../services/perfil';

@Component({
  selector: 'app-historico-pontos',
  templateUrl: './historico-pontos.page.html',
  styleUrls: ['./historico-pontos.page.scss'],
  standalone: false
})
export class HistoricoPontosPage {
  public historicoPontos: HistoricoPontos[] = [];
  public carregando = true;

  constructor(
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.carregarHistorico();
  }

  private async carregarHistorico() {
    this.carregando = true;

    try {
      this.historicoPontos = await this.perfilService.obterHistoricoPontos();
    } finally {
      this.carregando = false;
    }
  }

  public voltar() {
    this.router.navigateByUrl('/tabs/perfil');
  }

  public valorFormatado(pontos: number): string {
    return pontos > 0 ? `+${pontos}` : `${pontos}`;
  }
}
