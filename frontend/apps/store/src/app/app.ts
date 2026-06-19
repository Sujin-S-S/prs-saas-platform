import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@frontend/auth';
import { CartService } from './services/cart.service';

@Component({
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'store';
  auth = inject(AuthService);
  cartService = inject(CartService);
  router = inject(Router);

  elementRef = inject(ElementRef);
  showProfileDropdown = false;
  showMobileDrawer = false;

  toggleMobileDrawer(event: Event): void {
    event.stopPropagation();
    this.showMobileDrawer = !this.showMobileDrawer;
  }

  closeMobileDrawer(): void {
    this.showMobileDrawer = false;
  }

  isLoginPage(): boolean {
    return this.router.url.split('?')[0] === '/login';
  }

  navigateHome(): void {
    this.router.navigate(['/home']);
  }

  scrollToCart(): void {
    if (this.router.url !== '/products') {
      this.router.navigate(['/products']).then(() => {
        setTimeout(() => this.smoothScrollToCart(), 150);
      });
    } else {
      this.smoothScrollToCart();
    }
  }

  private smoothScrollToCart(): void {
    const el = document.querySelector('.checkout-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleProfileMenu(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const clickedInside = this.elementRef.nativeElement.querySelector('.profile-action')?.contains(event.target);
    if (!clickedInside) {
      this.showProfileDropdown = false;
    }
  }

  goToLogin(): void {
    this.showProfileDropdown = false;
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.showProfileDropdown = false;
    this.auth.logout();
    this.auth.setTenantId('sk47'); // Restore tenant ID context for storefront
    this.cartService.clearCart();
    this.router.navigate(['/login']);
  }
}
