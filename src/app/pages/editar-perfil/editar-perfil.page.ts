import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  PerfilService,
  UtilizadorPerfil
} from '../../services/perfil';

@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.page.html',
  styleUrls: ['./editar-perfil.page.scss'],
  standalone: false
})
export class EditarPerfilPage {

  public perfil: UtilizadorPerfil = {
    nome: '',
    email: '',
    telefone: '',
    morada: '',
    metodoPagamento: '',
    dieta: '',
    alergias: '',
    pontos: 0
  };

  public carregando = true;
  public guardando = false;
  public formSubmetido = false;
  public mensagemErro = '';

  constructor(
    private perfilService: PerfilService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.formSubmetido = false;
    this.mensagemErro = '';
    this.carregarPerfil();
  }

  private async carregarPerfil() {
    this.carregando = true;

    try {
      const perfilGuardado = await this.perfilService.obterPerfil();

      if (!perfilGuardado) {
        this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }

      this.perfil = {
        ...perfilGuardado,
        dieta: perfilGuardado.dieta || '',
        alergias: perfilGuardado.alergias || ''
      };
    } catch (erro) {
      console.error('Erro ao carregar perfil:', erro);
    } finally {
      this.carregando = false;
    }
  }

  // ── Validadores auxiliares ──────────────────────────────────────────────────

  public emailValido(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  public telefoneValido(telefone: string): boolean {
    const limpo = telefone.replace(/\s/g, '');
    // Aceita móvel português (9x) e fixo (2x)
    return /^(9[1236]\d{7}|2\d{8})$/.test(limpo);
  }

  // ── Navegação ───────────────────────────────────────────────────────────────

  public voltar() {
    this.router.navigateByUrl('/tabs/perfil');
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────

  public async guardarAlteracoes() {
    this.formSubmetido = true;
    this.mensagemErro = '';

    // Trim antes de validar
    this.perfil.nome             = this.perfil.nome.trim();
    this.perfil.email            = this.perfil.email.trim().toLowerCase();
    this.perfil.telefone         = this.perfil.telefone.trim();
    this.perfil.morada           = this.perfil.morada.trim();
    this.perfil.metodoPagamento  = this.perfil.metodoPagamento.trim();
    this.perfil.dieta            = this.perfil.dieta.trim();
    this.perfil.alergias         = this.perfil.alergias.trim();

    if (!this.perfil.nome || this.perfil.nome.length < 2) {
      this.mensagemErro = 'Introduz um nome válido (mínimo 2 caracteres).';
      return;
    }

    if (!this.emailValido(this.perfil.email)) {
      this.mensagemErro = 'Introduz um email válido.';
      return;
    }

    if (this.perfil.telefone && !this.telefoneValido(this.perfil.telefone)) {
      this.mensagemErro = 'Introduz um telefone português válido (ex: 912345678 ou 253000000).';
      return;
    }

    if (this.perfil.morada && this.perfil.morada.length < 5) {
      this.mensagemErro = 'A morada deve ter pelo menos 5 caracteres.';
      return;
    }

    this.guardando = true;

    try {
      await this.perfilService.atualizarPerfil(this.perfil);
      this.router.navigateByUrl('/tabs/perfil');
    } catch (erro) {
      console.error('Erro ao guardar perfil:', erro);
      this.mensagemErro = 'Erro ao guardar. Tenta novamente.';
    } finally {
      this.guardando = false;
    }
  }
}
