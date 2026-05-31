import { Component } from '@angular/core';
import { PerfilService } from '../../services/perfil';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registo',
  templateUrl: './registo.page.html',
  styleUrls: ['./registo.page.scss'],
  standalone: false
})
export class RegistoPage {

  public registoForm: FormGroup;
  public formSubmetido = false;

  public mostrarPalavraPasse = false;
  public mostrarConfirmarPalavraPasse = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private perfilService: PerfilService
  ) {
    this.registoForm = this.formBuilder.group(
      {
        nome: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        palavraPasse: ['', [Validators.required, Validators.minLength(8)]],
        confirmarPalavraPasse: ['', [Validators.required]]
      },
      {
        validators: this.validarPalavrasPasseIguais
      }
    );
  }

  private validarPalavrasPasseIguais(control: AbstractControl): ValidationErrors | null {
    const palavraPasse = control.get('palavraPasse')?.value;
    const confirmarPalavraPasse = control.get('confirmarPalavraPasse')?.value;

    if (!palavraPasse || !confirmarPalavraPasse) {
      return null;
    }

    if (palavraPasse === confirmarPalavraPasse) {
      return null;
    }

    return { palavrasPasseDiferentes: true };
  }

  public alternarVisibilidadePalavraPasse() {
    this.mostrarPalavraPasse = !this.mostrarPalavraPasse;
  }

  public alternarVisibilidadeConfirmarPalavraPasse() {
    this.mostrarConfirmarPalavraPasse = !this.mostrarConfirmarPalavraPasse;
  }

  public async criarConta() {
      this.formSubmetido = true;

  if (this.registoForm.invalid) {
    return;
  }

  const nome = this.registoForm.value.nome;
  const email = this.registoForm.value.email;

  await this.perfilService.criarPerfilInicial(nome, email);

  const elementoAtivo = document.activeElement as HTMLElement | null;
  elementoAtivo?.blur();

  this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
  }

  public irParaLogin() {
    this.router.navigateByUrl('/login');
  }

  
}