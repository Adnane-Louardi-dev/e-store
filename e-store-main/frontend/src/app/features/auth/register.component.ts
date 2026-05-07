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
        <mat-card-title>Create account</mat-card-title>
        <mat-card-subtitle>Registration signs you in immediately.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field class="full-width">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName" autocomplete="given-name">
            <mat-error>{{ fieldError('firstName') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="full-width">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName" autocomplete="family-name">
            <mat-error>{{ fieldError('lastName') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email">
            <mat-error>{{ fieldError('email') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password">
            <mat-error>{{ fieldError('password') }}</mat-error>
          </mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
              <mat-icon>person_add</mat-icon>
              Register
            </button>
            <a mat-button routerLink="/login">I already have an account</a>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `
})
export class RegisterComponent {
  loading = false;
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]]
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
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error) => {
        this.loading = false;
        if (!this.errors.applyFormErrors(this.form, error)) {
          this.errors.show(error);
        }
      }
    });
  }

  fieldError(name: 'firstName' | 'lastName' | 'email' | 'password'): string {
    const control = this.form.controls[name];
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('email')) return 'Enter a valid email';
    if (control.hasError('minlength')) return 'Too short';
    if (control.hasError('maxlength')) return 'Too long';
    return '';
  }
}
