import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `
    <section class="page">
      <mat-card>
        <mat-card-content class="empty-state">
          <h1>Page not found</h1>
          <p>The page you opened does not exist.</p>
          <a mat-flat-button color="primary" routerLink="/">Back to catalog</a>
        </mat-card-content>
      </mat-card>
    </section>
  `
})
export class NotFoundComponent {}
