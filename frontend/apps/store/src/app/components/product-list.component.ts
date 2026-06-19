import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@frontend/auth';
import { StoreApiService } from '@frontend/api-client';
import { NotificationService, Product, Category } from '@frontend/shared';
import { LoaderComponent } from '@frontend/ui';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent {
  auth = inject(AuthService);
  storeApi = inject(StoreApiService);
  notifier = inject(NotificationService);
  cartService = inject(CartService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isLoading = signal(false);
  loaderMessage = signal('');

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string | null>(null);
  selectedVariants: { [prodId: string]: string } = {};

  // Coupon State
  couponCode = '';
  appliedCoupon = signal<string | null>(null);
  discountValue = signal<number>(0);
  discountType = signal<'Percentage' | 'Flat' | null>(null);

  // Computeds
  discount = computed(() => {
    const subtotal = this.cartService.cartSubtotal();
    const val = this.discountValue();
    const type = this.discountType();

    if (!type || val <= 0) return 0;
    if (type === 'Percentage') {
      return (subtotal * val) / 100;
    } else {
      return Math.min(subtotal, val);
    }
  });

  cartTotal = computed(() => {
    return Math.max(0, this.cartService.cartSubtotal() - this.discount());
  });

  constructor() {
    this.auth.setTenantId('sk47'); // Default to SK47 storefront
    
    // Subscribe to query parameters to filter by category
    this.route.queryParams.subscribe((params) => {
      const catId = params['categoryId'] || null;
      this.selectedCategoryId.set(catId);
      this.loadCatalog();
    });
  }

  loadCatalog(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Loading store catalog...');

    // Load categories first if not loaded
    if (this.categories().length === 0) {
      this.storeApi.getCategories().subscribe({
        next: (cats) => {
          this.categories.set(cats);
        },
        error: () => {
          this.notifier.error('Failed to load store categories.');
        }
      });
    }

    // Load products with category filter if active
    const params: any = {};
    const categoryId = this.selectedCategoryId();
    if (categoryId) {
      params.categoryId = categoryId;
    }

    this.storeApi.getProducts(params).subscribe({
      next: (res) => {
        this.products.set(res.products);
        // Pre-select first variant of each product
        res.products.forEach((p) => {
          if (p.variants && p.variants.length > 0) {
            this.selectedVariants[p.id] = p.variants[0].id;
          }
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error('Failed to load store products.');
      }
    });
  }

  selectCategory(categoryId: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoryId: categoryId || null },
      queryParamsHandling: 'merge'
    });
  }

  addToCart(product: Product): void {
    const selectedVarId = this.selectedVariants[product.id];
    const variant = product.variants?.find((v) => v.id === selectedVarId);

    if (!variant) {
      this.notifier.error('Please select a valid variant.');
      return;
    }

    if (variant.stockQuantity <= 0) {
      this.notifier.error('This product variant is out of stock!');
      return;
    }

    const price = Number(product.basePrice) + Number(variant.priceDifference);
    this.cartService.addToCart(product, variant.id, variant.name, price);
    this.notifier.success(`Added ${product.name} to cart.`);
  }

  applyCoupon(): void {
    if (!this.couponCode) return;
    this.isLoading.set(true);
    this.loaderMessage.set('Verifying coupon code...');

    this.storeApi.validateCoupon(this.couponCode, this.cartService.cartSubtotal()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.valid) {
          this.appliedCoupon.set(this.couponCode.toUpperCase());
          this.discountValue.set(Number(res.discountValue));
          this.discountType.set(res.discountType);
          this.notifier.success(`Coupon applied: ${res.discountValue}${res.discountType === 'Percentage' ? '%' : '$'} discount!`);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Invalid coupon code.');
      }
    });
  }

  onCheckout(): void {
    if (!this.auth.isAuthenticated()) {
      this.notifier.info('Please sign in to place your order.');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    this.loaderMessage.set('Processing checkout...');

    const orderPayload = {
      items: this.cartService.cart().map((item) => ({
        productVariantId: item.variantId,
        quantity: item.quantity
      })),
      shippingAddress: {
        type: 'Shipping' as const,
        addressLine1: '789 Fashion Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10018'
      },
      billingAddress: {
        type: 'Billing' as const,
        addressLine1: '789 Fashion Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10018'
      },
      couponCode: this.appliedCoupon() || undefined,
      paymentMethod: 'Credit Card'
    };

    this.storeApi.checkout(orderPayload).subscribe({
      next: (order) => {
        this.isLoading.set(false);
        this.notifier.success(`Order Placed! Order Number: ${order.orderNumber}`);
        this.cartService.clearCart();
        this.appliedCoupon.set(null);
        this.discountValue.set(0);
        this.discountType.set(null);
        this.couponCode = '';
        this.loadCatalog(); // Refresh catalog stock values
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Checkout failed.');
      }
    });
  }
}
