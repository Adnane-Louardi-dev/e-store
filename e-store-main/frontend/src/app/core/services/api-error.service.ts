import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from '../models/api';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  constructor(private readonly snackBar: MatSnackBar) {}

  message(error: unknown): string {
    const apiError = this.apiError(error);
    if (apiError?.message) {
      return apiError.message;
    }
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Backend is not reachable. Start the Spring Boot server and try again.';
    }
    return 'Something went wrong. Please try again.';
  }

  show(error: unknown): void {
    this.snackBar.open(this.message(error), 'Close', { duration: 4200 });
  }

  success(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 2600 });
  }

  applyFormErrors(form: FormGroup, error: unknown): boolean {
    const apiError = this.apiError(error);
    if (!apiError?.errors?.length) {
      return false;
    }
    for (const violation of apiError.errors) {
      const control = form.get(violation.field);
      control?.setErrors({ server: violation.message });
      control?.markAsTouched();
    }
    return true;
  }

  private apiError(error: unknown): ApiError | null {
    if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
      return error.error as ApiError;
    }
    return null;
  }
}
