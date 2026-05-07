import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { CategoryResponse } from '../../core/models/api';
import { AdminService } from '../../core/services/admin.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule],
  template: `
    <section class="page">
      <div class="page-header"><h1>Categories</h1></div>
      <div class="grid two-col">
        <mat-card>
          <mat-card-header><mat-card-title>{{ editing ? 'Edit category' : 'New category' }}</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()">
              <mat-form-field class="full-width"><mat-label>Name</mat-label><input matInput formControlName="name"><mat-error>{{ error('name') }}</mat-error></mat-form-field>
              <mat-form-field class="full-width"><mat-label>Description</mat-label><textarea matInput rows="4" formControlName="description"></textarea><mat-error>{{ error('description') }}</mat-error></mat-form-field>
              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid"><mat-icon>save</mat-icon>Save</button>
                <button mat-button type="button" (click)="reset()">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            <table mat-table [dataSource]="categories">
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let category">{{ category.name }}</td></ng-container>
              <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let category">{{ category.description }}</td></ng-container>
              <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let category">
                <button mat-icon-button type="button" (click)="edit(category)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" type="button" (click)="delete(category.id)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
              </td></ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `
})
export class AdminCategoriesComponent implements OnInit {
  readonly columns = ['name', 'description', 'actions'];
  categories: CategoryResponse[] = [];
  editing: CategoryResponse | null = null;
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', Validators.maxLength(500)]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly catalog: CatalogService,
    private readonly admin: AdminService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.catalog.categories().subscribe({
      next: (categories) => (this.categories = categories),
      error: (error) => this.errors.show(error)
    });
  }

  save(): void {
    const request = this.form.getRawValue();
    const action = this.editing
      ? this.admin.updateCategory(this.editing.id, request)
      : this.admin.createCategory(request);
    action.subscribe({
      next: () => {
        this.reset();
        this.load();
      },
      error: (error) => {
        if (!this.errors.applyFormErrors(this.form, error)) this.errors.show(error);
      }
    });
  }

  edit(category: CategoryResponse): void {
    this.editing = category;
    this.form.patchValue({ name: category.name, description: category.description ?? '' });
  }

  delete(id: number): void {
    this.admin.deleteCategory(id).subscribe({
      next: () => this.load(),
      error: (error) => this.errors.show(error)
    });
  }

  reset(): void {
    this.editing = null;
    this.form.reset({ name: '', description: '' });
  }

  error(name: 'name' | 'description'): string {
    const control = this.form.controls[name];
    if (control.hasError('server')) return control.getError('server');
    if (control.hasError('required')) return 'Required';
    if (control.hasError('maxlength')) return 'Too long';
    return '';
  }
}
