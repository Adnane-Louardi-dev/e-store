import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserResponse } from '../../core/models/api';
import { ProfileService } from '../../core/services/profile.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="page">
      <div class="page-header"><h1>Profile</h1></div>
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ user?.firstName }} {{ user?.lastName }}</mat-card-title>
          <mat-card-subtitle>{{ user?.email }} - {{ user?.role }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field class="full-width"><mat-label>Phone</mat-label><input matInput formControlName="phone"><mat-error>{{ error('phone') }}</mat-error></mat-form-field>
            <mat-form-field class="full-width"><mat-label>Address</mat-label><input matInput formControlName="address"><mat-error>{{ error('address') }}</mat-error></mat-form-field>
            <mat-form-field class="full-width"><mat-label>City</mat-label><input matInput formControlName="city"><mat-error>{{ error('city') }}</mat-error></mat-form-field>
            <mat-form-field class="full-width"><mat-label>Country</mat-label><input matInput formControlName="country"><mat-error>{{ error('country') }}</mat-error></mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">
              <mat-icon>save</mat-icon>
              Save profile
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </section>
  `
})
export class ProfileComponent implements OnInit {
  user: UserResponse | null = null;
  saving = false;
  readonly form = this.fb.nonNullable.group({
    phone: ['', Validators.maxLength(30)],
    address: ['', Validators.maxLength(200)],
    city: ['', Validators.maxLength(80)],
    country: ['', Validators.maxLength(80)]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly profile: ProfileService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    this.profile.me().subscribe({
      next: (user) => {
        this.user = user;
        this.form.patchValue({
          phone: user.profile?.phone ?? '',
          address: user.profile?.address ?? '',
          city: user.profile?.city ?? '',
          country: user.profile?.country ?? ''
        });
      },
      error: (error) => this.errors.show(error)
    });
  }

  save(): void {
    this.saving = true;
    this.profile.update(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.user = user;
        this.saving = false;
      },
      error: (error) => {
        this.saving = false;
        if (!this.errors.applyFormErrors(this.form, error)) {
          this.errors.show(error);
        }
      }
    });
  }

  error(name: 'phone' | 'address' | 'city' | 'country'): string {
    const control = this.form.controls[name];
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('maxlength')) return 'Too long';
    return '';
  }
}
