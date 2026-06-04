import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  PerfilService,
  UtilizadorPerfil,
  HistoricoPontos
} from '../../services/perfil';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage {

  public perfil?: UtilizadorPerfil;
  public historicoPontos: HistoricoPontos[] = [];
  public iniciais = '';
  public carregando = true;
  public mostrarHistorico = false;

  constructor(
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.carregarPerfil();
  }

  private async carregarPerfil() {
  this.carregando = true;

  try {
    const perfilGuardado = await this.perfilService.obterPerfil();

    if (!perfilGuardado) {
      // Redirecionar para login preservando returnUrl
      this.router.navigateByUrl('/login?returnUrl=/tabs/perfil', { replaceUrl: true });
      return;
    }

    this.perfil = perfilGuardado;
    this.historicoPontos = await this.perfilService.obterHistoricoPontos();

    this.iniciais = this.perfilService.gerarIniciais(this.perfil.nome);
  } catch (erro) {
    console.error('Erro ao carregar perfil:', erro);
  } finally {
    this.carregando = false;
  }
}

  public editarPerfil() {
    this.router.navigateByUrl('/tabs/editar-perfil');
  }

  public entrar() {
    this.router.navigateByUrl('/login');
  }

  public criarPerfil() {
    this.router.navigateByUrl('/registo');
  }

  public alternarHistoricoPontos() {
    this.mostrarHistorico = !this.mostrarHistorico;
  }

  public abrirMorada() {
  this.router.navigateByUrl('/tabs/moradas');
}

public abrirMetodoPagamento() {
  this.router.navigateByUrl('/tabs/pagamentos');
}

  public abrirHistoricoPedidos() {
    this.router.navigateByUrl('/tabs/pedidos');
  }

  public abrirAjuda() {
    console.log('Abrir central de ajuda');
  }

  public async sair() {
    await this.perfilService.terminarSessao();

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();

    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
