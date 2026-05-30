import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

  public loginForm: FormGroup;
  public formSubmetido = false;

  public mostrarPalavraPasse = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      palavraPasse: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  public alternarVisibilidadePalavraPasse() {
    this.mostrarPalavraPasse = !this.mostrarPalavraPasse;
  }

  public entrar() {
  this.formSubmetido = true;

  if (this.loginForm.invalid) {
    return;
  }

  const dadosLogin = {
    email: this.loginForm.value.email,
    palavraPasse: this.loginForm.value.palavraPasse
  };

  console.log('Login efetuado:', dadosLogin);

  const elementoAtivo = document.activeElement as HTMLElement | null;
  elementoAtivo?.blur();

  this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }
  public irParaRegisto() {
    this.router.navigateByUrl('/registo');
  }

  public esqueciPalavraPasse() {
    console.log('Recuperação de palavra-passe');
  }
}