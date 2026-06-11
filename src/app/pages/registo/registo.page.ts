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
  selector: 'app-registo',
  templateUrl: './registo.page.html',
  styleUrls: ['./registo.page.scss'],
  standalone: false
})
export class RegistoPage {

  public registoForm: FormGroup;
  public formSubmetido = false;
  public emailJaExiste = false;
  public erroRegisto = false;

  public mostrarPalavraPasse = false;
  public dietaAberta = false;
  public opcoesDieta = ['Vegan', 'Vegetariana', 'Flexitariana'];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private perfilService: PerfilService,
    private carrinhoService: Carrinho
  ) {
    this.registoForm = this.formBuilder.group(
      {
        nome: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        palavraPasse: ['', [Validators.required, Validators.minLength(6)]],
        tipoDieta: ['Vegan'],
        alergenios: ['']
      }
    );
  }

  public alternarVisibilidadePalavraPasse() {
    this.mostrarPalavraPasse = !this.mostrarPalavraPasse;
  }

  public alternarDieta() {
    this.dietaAberta = !this.dietaAberta;
  }

  public selecionarDieta(dieta: string) {
    this.registoForm.patchValue({ tipoDieta: dieta });
    this.dietaAberta = false;
  }

  public async criarConta() {
      this.formSubmetido = true;
      this.emailJaExiste = false;
      this.erroRegisto = false;

  if (this.registoForm.invalid) {
    return;
  }

  const nome = this.registoForm.value.nome;
  const email = this.registoForm.value.email.trim().toLowerCase();
  const palavraPasse = this.registoForm.value.palavraPasse;
  const tipoDieta = this.registoForm.value.tipoDieta;
  const alergenios = this.registoForm.value.alergenios;

  if (await this.perfilService.existePerfil(email)) {
    this.emailJaExiste = true;
    this.registoForm.get('email')?.setErrors({ emailJaExiste: true });
    return;
  }

  try {
    await this.perfilService.criarPerfilInicial(nome, email, palavraPasse, tipoDieta, alergenios);
  } catch (erro) {
    console.error('Erro no registo:', erro);
    this.erroRegisto = true;
    return;
  }

  this.carrinhoService.migrarGuestParaUtilizador(email);

  const elementoAtivo = document.activeElement as HTMLElement | null;
  elementoAtivo?.blur();

  const returnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '/tabs/inicio';
  this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }

  public irParaLogin() {
    this.router.navigateByUrl('/login');
  }

  
}
