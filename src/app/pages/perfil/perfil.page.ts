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
      this.perfil = undefined;
      this.historicoPontos = [];
      this.iniciais = '';
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
    this.router.navigateByUrl('/tabs/historico-pontos');
  }

  public escolherFoto(input: HTMLInputElement) {
    input.click();
  }

  public async alterarFoto(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const ficheiro = input.files?.[0];

    if (!ficheiro || !this.perfil) {
      return;
    }

    const fotoPerfil = await this.lerFicheiroComoDataUrl(ficheiro);
    this.perfil = {
      ...this.perfil,
      fotoPerfil
    };
    await this.perfilService.atualizarPerfil(this.perfil);
    input.value = '';
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

  private lerFicheiroComoDataUrl(ficheiro: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = () => reject(leitor.error);
      leitor.readAsDataURL(ficheiro);
    });
  }
}
