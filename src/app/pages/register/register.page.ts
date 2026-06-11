import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    diet: ['Vegan', Validators.required],
    allergies: [''],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {}

  async submit(): Promise<void> {
    if (this.form.valid) {
      await this.auth.register({
        name: this.form.value.name ?? '',
        email: this.form.value.email ?? '',
        password: this.form.value.password ?? '',
        diet: this.form.value.diet ?? 'Vegan',
        allergies: this.form.value.allergies ?? '',
      });
      void this.router.navigate(['/inicio'], { queryParams: { novo: true } });
    }
  }
}
