import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PerfilService } from '../../services/perfil';
import { CarrinhoService } from '../../services/carrinho';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

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
    private activatedRoute: ActivatedRoute,
    private perfilService: PerfilService,
    private carrinhoService: CarrinhoService
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

    return palavraPasse === confirmarPalavraPasse ? null : { palavrasPasseDiferentes: true };
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

    // Criar perfil inicial
    await this.perfilService.criarPerfilInicial(nome, email);

    // Migrar carrinho de convidado para o novo utilizador
    await this.carrinhoService.migrarCarrinhoGuestParaUtilizador();

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();

    // Respeitar returnUrl se existir
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '/tabs/inicio';

    this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }

  public irParaLogin() {
    // Passar returnUrl para o login também
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '';

    if (returnUrl) {
      this.router.navigateByUrl(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else {
      this.router.navigateByUrl('/login');
    }
  }
}
