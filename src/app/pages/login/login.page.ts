import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  form = this.fb.group({
    email: ['inesmpmarinho@gmail.com', [Validators.required, Validators.email]],
    password: ['verdevegan', [Validators.required, Validators.minLength(6)]],
  });
  errorMessage = '';
  recoveryMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {}

  async submit(): Promise<void> {
    this.recoveryMessage = '';
    if (this.form.valid) {
      const result = await this.auth.login(this.form.value.email ?? '', this.form.value.password ?? '');
      if (result === 'missing') {
        this.errorMessage = 'Esta conta ainda não existe. Cria uma conta primeiro.';
        return;
      }
      if (result === 'invalid-password') {
        this.errorMessage = 'A palavra-passe não está correta.';
        return;
      }
      void this.router.navigate(['/inicio'], { queryParams: { origem: 'login' } });
    }
  }

  async recoverPassword(): Promise<void> {
    const emailControl = this.form.controls.email;
    this.errorMessage = '';
    this.recoveryMessage = '';

    if (emailControl.invalid) {
      emailControl.markAsTouched();
      this.errorMessage = 'Escreve um email válido para recuperar a palavra-passe.';
      return;
    }

    const email = emailControl.value ?? '';
    const sent = await this.auth.recoverPassword(email);

    if (!sent) {
      this.errorMessage = 'Não foi possível enviar o email de recuperação. Tenta novamente.';
      return;
    }

    this.recoveryMessage = `Enviámos um email de recuperação para ${email}.`;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
