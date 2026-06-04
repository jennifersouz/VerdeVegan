import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PerfilService } from '../../services/perfil';
import { CarrinhoService } from '../../services/carrinho';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

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
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private perfilService: PerfilService,
    private carrinhoService: CarrinhoService
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

    if (this.loginForm.invalid) {
      return;
    }

    const email = this.loginForm.value.email;

    // Iniciar sessão (cria perfil se ainda não existe)
    await this.perfilService.iniciarSessao(email);

    // Migrar carrinho de convidado para o utilizador autenticado
    await this.carrinhoService.migrarCarrinhoGuestParaUtilizador();

    const elementoAtivo = document.activeElement as HTMLElement | null;
    elementoAtivo?.blur();

    // Respeitar returnUrl se existir, caso contrário vai para Início
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '/tabs/inicio';

    this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }

  public irParaRegisto() {
    // Passar returnUrl para o registo também
    const returnUrl =
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl') || '';

    if (returnUrl) {
      this.router.navigateByUrl(`/registo?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else {
      this.router.navigateByUrl('/registo');
    }
  }

  public esqueciPalavraPasse() {
    console.log('Recuperação de palavra-passe — funcionalidade pendente');
  }
}
