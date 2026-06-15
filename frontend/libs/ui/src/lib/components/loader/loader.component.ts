import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'ui-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="isLoading" [ngClass]="isFullScreen ? 'overlay-loader' : 'inline-loader'">
      <div class="loader-content">
        <mat-progress-spinner mode="indeterminate" diameter="50" color="primary"></mat-progress-spinner>
        <p *ngIf="message" class="loader-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .overlay-loader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(2px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    .inline-loader {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      width: 100%;
    }
    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .loader-message {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class LoaderComponent {
  @Input() isLoading = false;
  @Input() isFullScreen = true;
  @Input() message = 'Loading...';
}
