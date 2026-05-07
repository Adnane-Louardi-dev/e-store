import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>Login</mat-card-title>
        <mat-card-subtitle>Use user&#64;estore.com / password123 for the seeded customer.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email">
            <mat-error>{{ fieldError('email') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password">
            <mat-error>{{ fieldError('password') }}</mat-error>
          </mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
              <mat-icon>login</mat-icon>
              Login
            </button>
            <a mat-button routerLink="/register">Create account</a>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `
})
export class LoginComponent {
  loading = false;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly errors: ApiErrorService,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error) => {
        this.loading = false;
        if (!this.errors.applyFormErrors(this.form, error)) {
          this.errors.show(error);
        }
      }
    });
  }

  fieldError(name: 'email' | 'password'): string {
    const control = this.form.controls[name];
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('email')) return 'Enter a valid email';
    return '';
  }
}
