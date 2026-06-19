import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StoreApiService } from '@frontend/api-client';
import { Category, Product } from '@frontend/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  router = inject(Router);
  storeApi = inject(StoreApiService);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  isLoading = signal(false);

  // Carousel slider indices
  currentCategoryIndex = signal(0);
  currentProductIndex = signal(0);
  
  // Responsive slider card count
  visibleCards = signal(3);

  @HostListener('window:resize', [])
  onResize(): void {
    this.updateVisibleCards();
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    this.updateVisibleCards();
    
    // Fetch categories
    this.storeApi.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
      },
      error: () => {}
    });

    // Fetch products
    this.storeApi.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.products);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private updateVisibleCards(): void {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width > 1024) {
      this.visibleCards.set(3);
    } else if (width > 768) {
      this.visibleCards.set(2);
    } else {
      this.visibleCards.set(1);
    }
  }

  getCategoryIcon(slug: string): string {
    switch (slug) {
      case 'shirts': return 'checkroom';
      case 'jeans-trousers': return 'layers';
      case 'jackets-blazers': return 'storefront';
      case 'shoes-accessories': return 'watch';
      case 'suits-formalwear': return 'dry_cleaning';
      default: return 'shopping_bag';
    }
  }

  goToCategory(categoryId: string): void {
    this.router.navigate(['/products'], { queryParams: { categoryId } });
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  // Categories Slider Navigation
  nextCategory(): void {
    const total = this.categories().length;
    const visible = this.visibleCards();
    const maxIndex = Math.max(0, total - visible);
    if (maxIndex === 0) return;
    this.currentCategoryIndex.update((i) => (i >= maxIndex ? 0 : i + 1));
  }

  prevCategory(): void {
    const total = this.categories().length;
    const visible = this.visibleCards();
    const maxIndex = Math.max(0, total - visible);
    if (maxIndex === 0) return;
    this.currentCategoryIndex.update((i) => (i === 0 ? maxIndex : i - 1));
  }

  // Products Slider Navigation
  nextProduct(): void {
    const total = this.products().length;
    const visible = this.visibleCards();
    const maxIndex = Math.max(0, total - visible);
    if (maxIndex === 0) return;
    this.currentProductIndex.update((i) => (i >= maxIndex ? 0 : i + 1));
  }

  prevProduct(): void {
    const total = this.products().length;
    const visible = this.visibleCards();
    const maxIndex = Math.max(0, total - visible);
    if (maxIndex === 0) return;
    this.currentProductIndex.update((i) => (i === 0 ? maxIndex : i - 1));
  }
}
