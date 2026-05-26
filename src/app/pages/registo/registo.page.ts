import { Component } from '@angular/core';
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
    private router: Router
  ) {
    this.registoForm = this.formBuilder.group(
      {
        nome: ['', [Validators.required, Validators.minLength(3)]],
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

  public criarConta() {
    this.formSubmetido = true;

    if (this.registoForm.invalid) {
      return;
    }

    const novoUtilizador = {
      nome: this.registoForm.value.nome,
      email: this.registoForm.value.email,
      pontos: 0
    };

    console.log('Utilizador criado:', novoUtilizador);

    this.router.navigateByUrl('/login');
  }

  public irParaLogin() {
    this.router.navigateByUrl('/login');
  }
}