import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductResponse, ReviewResponse } from '../../core/models/api';
import { ReviewService } from '../../core/services/review.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  styles: [`
    .detail-img {
      width: 100%;
      max-height: 430px;
      object-fit: cover;
      border-radius: 8px;
      background: #edf0f5;
    }

    .review {
      border-top: 1px solid #e4e8f0;
      padding: 14px 0;
    }
  `],
  template: `
    <section class="page">
      @if (!product) {
        <mat-card><div class="loading-state">Loading product...</div></mat-card>
      } @else {
        <div class="grid two-col">
          <div>
            <img class="detail-img" [src]="product.imageUrl || fallbackImage(product.name)" [alt]="product.name">
            <mat-card style="margin-top:18px">
              <mat-card-header>
                <mat-card-title>Reviews</mat-card-title>
                <mat-card-subtitle>{{ reviewsUnavailable ? 'Reviews are temporarily unavailable.' : reviews.length + ' review(s)' }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @if (reviewsUnavailable) {
                  <div class="error-state">MongoDB-backed reviews could not be loaded.</div>
                } @else if (!reviews.length) {
                  <div class="empty-state">No reviews yet.</div>
                } @else {
                  @for (review of reviews; track review.id) {
                    <div class="review">
                      <strong>{{ review.authorName }}</strong>
                      <div>{{ stars(review.rating) }}</div>
                      <p>{{ review.comment || 'No comment.' }}</p>
                      <small class="muted">{{ review.createdAt | date:'medium' }}</small>
                    </div>
                  }
                }
                @if (auth.isLoggedIn()) {
                  <form [formGroup]="reviewForm" (ngSubmit)="submitReview()" style="margin-top:16px">
                    <mat-form-field class="full-width">
                      <mat-label>Rating</mat-label>
                      <mat-select formControlName="rating">
                        @for (rating of [5,4,3,2,1]; track rating) {
                          <mat-option [value]="rating">{{ stars(rating) }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Comment</mat-label>
                      <textarea matInput rows="3" formControlName="comment"></textarea>
                    </mat-form-field>
                    <button mat-flat-button color="primary" type="submit" [disabled]="reviewForm.invalid">Post review</button>
                  </form>
                }
              </mat-card-content>
            </mat-card>
          </div>
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ product.name }}</mat-card-title>
              <mat-card-subtitle>{{ product.category.name }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="price">{{ product.price | currency }}</p>
              <p>{{ product.description || 'No description available.' }}</p>
              <mat-chip-set>
                <mat-chip [color]="product.quantityInStock > 0 ? 'primary' : 'warn'" highlighted>
                  {{ product.quantityInStock > 0 ? product.quantityInStock + ' in stock' : 'Out of stock' }}
                </mat-chip>
              </mat-chip-set>
              <form [formGroup]="cartForm" (ngSubmit)="addToCart()" style="margin-top:18px">
                <mat-form-field class="full-width">
                  <mat-label>Quantity</mat-label>
                  <input matInput type="number" min="1" formControlName="quantity">
                </mat-form-field>
                <div class="actions">
                  <button mat-flat-button color="primary" type="submit" [disabled]="cartForm.invalid || product.quantityInStock === 0">
                    <mat-icon>add_shopping_cart</mat-icon>
                    Add to cart
                  </button>
                  <a mat-button routerLink="/">Back</a>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </section>
  `
})
export class ProductDetailComponent implements OnInit {
  product: ProductResponse | null = null;
  reviews: ReviewResponse[] = [];
  reviewsUnavailable = false;
  readonly cartForm = this.fb.nonNullable.group({ quantity: [1, [Validators.required, Validators.min(1)]] });
  readonly reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', Validators.maxLength(2000)]
  });

  constructor(
    readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly catalog: CatalogService,
    private readonly reviewsApi: ReviewService,
    private readonly cart: CartService,
    private readonly errors: ApiErrorService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      product: this.catalog.product(id),
      reviews: this.reviewsApi.forProduct(id).pipe(catchError(() => {
        this.reviewsUnavailable = true;
        return of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true });
      }))
    }).subscribe({
      next: ({ product, reviews }) => {
        this.product = product;
        this.reviews = reviews.content;
      },
      error: (error) => this.errors.show(error)
    });
  }

  addToCart(): void {
    if (!this.product) return;
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.cart.add({ productId: this.product.id, quantity: this.cartForm.controls.quantity.value }).subscribe({
      next: () => this.errors.success('Added to cart.'),
      error: (error) => this.errors.show(error)
    });
  }

  submitReview(): void {
    if (!this.product || this.reviewForm.invalid) return;
    this.reviewsApi.create({ productId: this.product.id, ...this.reviewForm.getRawValue() }).subscribe({
      next: (review) => {
        this.reviews = [review, ...this.reviews];
        this.reviewForm.reset({ rating: 5, comment: '' });
      },
      error: (error) => this.errors.show(error)
    });
  }

  stars(rating: number): string {
    return 'Rating ' + rating + '/5';
  }

  fallbackImage(name: string): string {
    return `https://placehold.co/900x600?text=${encodeURIComponent(name)}`;
  }
}
