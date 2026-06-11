import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  PerfilService,
  MoradaEntrega
} from '../../services/perfil';

@Component({
  selector: 'app-moradas',
  templateUrl: './moradas.page.html',
  styleUrls: ['./moradas.page.scss'],
  standalone: false
})
export class MoradasPage {

  public moradas: MoradaEntrega[] = [];
  public carregando = true;

  public formularioAberto = false;
  public editandoId: number | null = null;

  public novaMorada: MoradaEntrega = this.criarMoradaVazia();

  public formSubmetido = false;
  public mensagemErro = '';

  constructor(
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.carregarMoradas();
  }

  private async carregarMoradas() {
    this.carregando = true;

    try {
      this.moradas = await this.perfilService.obterMoradas();
    } catch (erro) {
      console.error('Erro ao carregar moradas:', erro);
    } finally {
      this.carregando = false;
    }
  }

  private criarMoradaVazia(): MoradaEntrega {
    return {
      id: Date.now(),
      titulo: '',
      rua: '',
      numero: '',
      codigoPostal: '',
      cidade: '',
      localidade: '',
      principal: false
    };
  }

  // ── Validadores auxiliares ──────────────────────────────────────────────────

  public codigoPostalValido(codigoPostal: string): boolean {
    return /^\d{4}-\d{3}$/.test(codigoPostal.trim());
  }

  // ── Navegação ───────────────────────────────────────────────────────────────

  public voltar() {
    this.router.navigateByUrl('/tabs/perfil');
  }

  public abrirFormulario() {
    this.editandoId = null;
    this.novaMorada = this.criarMoradaVazia();
    this.formSubmetido = false;
    this.mensagemErro = '';
    this.formularioAberto = true;
  }

  public editarMorada(morada: MoradaEntrega) {
    this.editandoId = morada.id;
    this.novaMorada = { ...morada };

    if (!this.novaMorada.numero && this.novaMorada.rua.includes(',')) {
      const partesRua = this.novaMorada.rua.split(',');
      this.novaMorada.numero = partesRua.pop()?.trim() || '';
      this.novaMorada.rua = partesRua.join(',').trim();
    }

    if (!this.novaMorada.localidade) {
      this.novaMorada.localidade = this.novaMorada.cidade;
    }

    this.formSubmetido = false;
    this.mensagemErro = '';
    this.formularioAberto = true;
  }

  public fecharFormulario() {
    this.formularioAberto = false;
    this.editandoId = null;
    this.novaMorada = this.criarMoradaVazia();
    this.formSubmetido = false;
    this.mensagemErro = '';
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────

  public async guardarMorada() {
    this.formSubmetido = true;
    this.mensagemErro = '';

    // Trim antes de validar
    this.novaMorada.titulo       = this.novaMorada.titulo.trim();
    this.novaMorada.rua          = this.novaMorada.rua.trim();
    this.novaMorada.numero       = this.novaMorada.numero?.trim() || '';
    this.novaMorada.codigoPostal = this.novaMorada.codigoPostal.trim();
    this.novaMorada.cidade       = this.novaMorada.cidade.trim();
    this.novaMorada.localidade   = this.novaMorada.localidade?.trim() || '';

    if (!this.novaMorada.titulo || this.novaMorada.titulo.length < 2) {
      this.mensagemErro = 'Introduz um título válido (mínimo 2 caracteres).';
      return;
    }

    if (!this.novaMorada.rua || this.novaMorada.rua.length < 5) {
      this.mensagemErro = 'Introduz uma rua válida (mínimo 5 caracteres).';
      return;
    }

    if (!this.novaMorada.numero) {
      this.mensagemErro = 'Introduz o número da morada.';
      return;
    }

    if (!this.codigoPostalValido(this.novaMorada.codigoPostal)) {
      this.mensagemErro = 'Introduz um código postal válido no formato 0000-000.';
      return;
    }

    if (!this.novaMorada.cidade || this.novaMorada.cidade.length < 2) {
      this.mensagemErro = 'Introduz uma cidade válida.';
      return;
    }

    if (!this.novaMorada.localidade || this.novaMorada.localidade.length < 2) {
      this.mensagemErro = 'Introduz uma localidade válida.';
      return;
    }

    if (this.editandoId) {
      this.moradas = this.moradas.map((morada: MoradaEntrega) =>
        morada.id === this.editandoId ? { ...this.novaMorada } : morada
      );

      if (this.novaMorada.principal) {
        this.moradas.forEach((morada: MoradaEntrega) => {
          morada.principal = morada.id === this.novaMorada.id;
        });
      }

      await this.perfilService.guardarMoradas(this.moradas);
    } else {
      const moradaParaGuardar: MoradaEntrega = {
        ...this.novaMorada,
        id: Date.now()
      };

      await this.perfilService.adicionarMorada(moradaParaGuardar);
    }

    await this.carregarMoradas();
    this.fecharFormulario();
  }

  public async removerMorada(id: number) {
    await this.perfilService.removerMorada(id);
    await this.carregarMoradas();
  }

  public async definirPrincipal(id: number) {
    await this.perfilService.definirMoradaPrincipal(id);
    await this.carregarMoradas();
  }
}
