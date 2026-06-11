import { Component } from '@angular/core';
import { PerfilService } from '../../services/perfil';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Carrinho } from '../../services/carrinho';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

  public loginForm: FormGroup;
  public formSubmetido = false;
  public erroLogin = false;
  public erroRecuperacao = false;
  public recuperacaoSubmetida = false;
  public mensagemRecuperacao = '';

  public mostrarPalavraPasse = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private perfilService: PerfilService,
    private carrinhoService: Carrinho
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      palavraPasse: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  public alternarVisibilidadePalavraPasse() {
    this.mostrarPalavraPasse = !this.mostrarPalavraPasse;
  }

  public async entrar() {
    this.formSubmetido = true;
    this.erroLogin = false;
    this.erroRecuperacao = false;
    this.recuperacaoSubmetida = false;
    this.mensagemRecuperacao = '';

    if (this.loginForm.invalid) {
      return;
    }

    const email = this.loginForm.value.email.trim().toLowerCase();
    const palavraPasse = this.loginForm.value.palavraPasse;

    try {
      await this.perfilService.iniciarSessao(email, palavraPasse);
      this.carrinhoService.migrarGuestParaUtilizador(email);
    } catch (erro) {
      console.error('Erro no login:', erro);
      this.erroLogin = true;
      return;
    }

    console.log('Login efetuado:', { email });

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();

    const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '/tabs/inicio';
    this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }

  public irParaRegisto() {
    this.router.navigateByUrl('/registo');
  }

  public fecharLogin() {
    this.router.navigateByUrl('/tabs/inicio');
  }

  public async esqueciPalavraPasse() {
    const emailControl = this.loginForm.get('email');
    this.erroLogin = false;
    this.erroRecuperacao = false;
    this.recuperacaoSubmetida = true;
    this.mensagemRecuperacao = '';

    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    const email = emailControl.value.trim().toLowerCase();

    try {
      await this.perfilService.recuperarPalavraPasse(email);
      this.mensagemRecuperacao = `Enviámos um email de recuperação para ${email}.`;
    } catch (erro) {
      console.error('Erro na recuperação de palavra-passe:', erro);
      this.erroRecuperacao = true;
    }
  }
}
