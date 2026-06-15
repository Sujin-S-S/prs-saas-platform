import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@frontend/auth';
import { StoreApiService } from '@frontend/api-client';
import { NotificationService, Product, Category } from '@frontend/shared';
import { LoaderComponent } from '@frontend/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  template: `
    <!-- Spinner loader overlay -->
    <ui-loader [isLoading]="isLoading()" [message]="loaderMessage()"></ui-loader>

    <div class="store-container">
      <!-- Top header bar -->
      <header class="store-header">
        <div class="logo-area">
          <span class="material-icons store-icon">sports_martial_arts</span>
          <h1>SK47 MENS WEAR</h1>
        </div>
        <div class="user-action" *ngIf="auth.isAuthenticated()">
          <span class="user-greeting">Welcome, <strong>{{ auth.currentUser()?.firstName }}</strong></span>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </header>

      <!-- 1. LOGIN SCREEN -->
      <main class="login-wrapper" *ngIf="!auth.isAuthenticated()">
        <div class="login-card">
          <div class="login-header">
            <h2>Customer Sign In</h2>
            <p>Access your SK47 Mens Wear account to shop the premium collection.</p>
          </div>

          <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="login-form">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="email" 
                required 
                placeholder="sujin@ss.com"
                class="form-control">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                required 
                placeholder="••••••••"
                class="form-control">
            </div>

            <button type="submit" class="submit-btn" [disabled]="loginForm.invalid">Sign In</button>
          </form>

          <div class="credentials-hint">
            <p><strong>Demo Login Credentials:</strong></p>
            <p>Email: <code>sujin@ss.com</code> / Password: <code>customer123</code></p>
          </div>
        </div>
      </main>

      <!-- 2. STOREFRONT CATALOG & CHECKOUT -->
      <main class="catalog-wrapper" *ngIf="auth.isAuthenticated()">
        <!-- Store banner -->
        <section class="store-banner">
          <h2>Premium Menswear Collection</h2>
          <p>Handcrafted shirts, high-grade denim, and Italian wool blazers.</p>
        </section>

        <!-- Main content grid -->
        <div class="catalog-grid">
          <!-- Left side: Products catalog -->
          <div class="products-section">
            <h3>Explore Catalog</h3>
            <div class="product-cards">
              <div class="product-card" *ngFor="let prod of products()">
                <img [src]="prod.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c'" class="product-img" alt="Product Image">
                <div class="product-info">
                  <div class="product-meta">
                    <span class="product-sku">{{ prod.sku }}</span>
                    <span class="product-category">{{ prod.category?.name }}</span>
                  </div>
                  <h4>{{ prod.name }}</h4>
                  <p class="product-desc">{{ prod.description }}</p>
                  
                  <!-- Variants Selection -->
                  <div class="variants-area" *ngIf="prod.variants && prod.variants.length > 0">
                    <label>Select Option:</label>
                    <select [(ngModel)]="selectedVariants[prod.id]" class="variant-select">
                      <option *ngFor="let v of prod.variants" [value]="v.id">
                        {{ v.name }} (+{{ v.priceDifference | currency }}) - Stock: {{ v.stockQuantity }}
                      </option>
                    </select>
                  </div>

                  <div class="product-footer">
                    <span class="product-price">{{ prod.basePrice | currency }}</span>
                    <button class="add-to-cart-btn" (click)="addToCart(prod)">Buy Now</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: Cart Summary & Checkout -->
          <div class="checkout-section">
            <div class="checkout-card">
              <h3>Shopping Cart</h3>
              
              <div *ngIf="cart().length === 0" class="empty-cart">
                <span class="material-icons">shopping_bag</span>
                <p>Your cart is empty. Click "Buy Now" to add items.</p>
              </div>

              <div *ngIf="cart().length > 0" class="cart-items">
                <div class="cart-item" *ngFor="let item of cart()">
                  <div class="item-details">
                    <h5>{{ item.product.name }}</h5>
                    <p class="item-variant">{{ item.variantName }}</p>
                  </div>
                  <div class="item-meta">
                    <span class="item-qty">Qty: {{ item.quantity }}</span>
                    <span class="item-price">{{ item.price | currency }}</span>
                  </div>
                </div>

                <div class="cart-summary">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>{{ cartSubtotal() | currency }}</span>
                  </div>

                  <!-- Coupon Validation -->
                  <div class="coupon-area">
                    <input type="text" [(ngModel)]="couponCode" placeholder="Promo Code (e.g. SK47FIRST)" class="coupon-input">
                    <button (click)="applyCoupon()" class="coupon-btn">Apply</button>
                  </div>

                  <div class="summary-row discount-row" *ngIf="discount() > 0">
                    <span>Discount (Coupon: {{ appliedCoupon() }})</span>
                    <span>-{{ discount() | currency }}</span>
                  </div>

                  <div class="summary-row total-row">
                    <span>Total Amount</span>
                    <span>{{ cartTotal() | currency }}</span>
                  </div>
                </div>

                <button class="checkout-btn" (click)="onCheckout()">Place Order</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .store-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }
    .store-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .store-icon {
      font-size: 32px;
      color: #1e293b;
    }
    .logo-area h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #1e293b;
    }
    .user-greeting {
      font-size: 14px;
      margin-right: 16px;
      color: #64748b;
    }
    .logout-btn {
      background: none;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .logout-btn:hover {
      background: #f1f5f9;
    }

    /* Login Styles */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 150px);
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: white;
      padding: 36px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .login-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
    .login-header p {
      margin: 0 0 24px 0;
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 14px;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: #1e293b;
    }
    .submit-btn {
      width: 100%;
      background: #1e293b;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    .submit-btn:hover:not(:disabled) {
      background: #0f172a;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .credentials-hint {
      margin-top: 24px;
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px dashed #cbd5e1;
      font-size: 13px;
      color: #475569;
    }
    .credentials-hint p {
      margin: 4px 0;
    }

    /* Catalog Dashboard */
    .store-banner {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      padding: 40px 32px;
      border-radius: 12px;
      margin-bottom: 32px;
    }
    .store-banner h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
    }
    .store-banner p {
      margin: 0;
      opacity: 0.8;
      font-size: 16px;
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 32px;
    }
    .product-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }
    .product-card {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
    }
    .product-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .product-info {
      padding: 16px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .product-meta {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .product-info h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .product-desc {
      font-size: 13px;
      color: #64748b;
      margin: 0 0 16px 0;
      line-height: 1.4;
      flex-grow: 1;
    }
    .variants-area {
      margin-bottom: 16px;
    }
    .variants-area label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }
    .variant-select {
      width: 100%;
      padding: 6px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 12px;
      font-family: inherit;
    }
    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .product-price {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }
    .add-to-cart-btn {
      background: #1e293b;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .add-to-cart-btn:hover {
      background: #0f172a;
    }

    /* Checkout Card */
    .checkout-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      position: sticky;
      top: 20px;
    }
    .checkout-card h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
    }
    .empty-cart {
      text-align: center;
      padding: 32px 0;
      color: #94a3b8;
    }
    .empty-cart span {
      font-size: 40px;
    }
    .empty-cart p {
      font-size: 13px;
      margin-top: 8px;
    }
    .cart-items {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
    }
    .item-details h5 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
    }
    .item-variant {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .item-meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .item-qty {
      font-size: 12px;
      color: #64748b;
    }
    .item-price {
      font-size: 13px;
      font-weight: 600;
    }
    .cart-summary {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 12px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #475569;
    }
    .discount-row {
      color: #16a34a;
      font-weight: 500;
    }
    .total-row {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .coupon-area {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .coupon-input {
      flex-grow: 1;
      padding: 6px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 12px;
      font-family: inherit;
    }
    .coupon-btn {
      background: #64748b;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
    .checkout-btn {
      width: 100%;
      background: #16a34a;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    .checkout-btn:hover {
      background: #15803d;
    }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  storeApi = inject(StoreApiService);
  notifier = inject(NotificationService);

  isLoading = signal(false);
  loaderMessage = signal('');

  email = 'sujin@ss.com';
  password = 'customer123';

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedVariants: { [prodId: string]: string } = {};

  // Cart State
  cart = signal<{ product: Product; variantId: string; variantName: string; price: number; quantity: number }[]>([]);
  couponCode = '';
  appliedCoupon = signal<string | null>(null);
  discountValue = signal<number>(0);
  discountType = signal<'Percentage' | 'Flat' | null>(null);

  // Cart Computeds
  cartSubtotal = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.price * item.quantity, 0);
  });

  discount = computed(() => {
    const subtotal = this.cartSubtotal();
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
    return Math.max(0, this.cartSubtotal() - this.discount());
  });

  constructor() {
    this.auth.setTenantId('sk47'); // Default to SK47 storefront
    if (this.auth.isAuthenticated()) {
      this.loadCatalog();
    }
  }

  onLogin(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Authenticating account...');
    
    this.auth.loginCustomer(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notifier.success('Logged in successfully to SK47 storefront!');
        this.loadCatalog();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notifier.error(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.cart.set([]);
    this.appliedCoupon.set(null);
    this.discountValue.set(0);
    this.discountType.set(null);
    this.couponCode = '';
  }

  loadCatalog(): void {
    this.isLoading.set(true);
    this.loaderMessage.set('Loading store catalog...');

    this.storeApi.getProducts().subscribe({
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

    // Add to cart state
    const currentCart = [...this.cart()];
    const existingIdx = currentCart.findIndex((i) => i.variantId === variant.id);

    if (existingIdx > -1) {
      currentCart[existingIdx].quantity += 1;
    } else {
      currentCart.push({
        product,
        variantId: variant.id,
        variantName: variant.name,
        price,
        quantity: 1
      });
    }

    this.cart.set(currentCart);
    this.notifier.success(`Added ${product.name} to cart.`);
  }

  applyCoupon(): void {
    if (!this.couponCode) return;
    this.isLoading.set(true);
    this.loaderMessage.set('Verifying coupon code...');

    this.storeApi.validateCoupon(this.couponCode, this.cartSubtotal()).subscribe({
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
    this.isLoading.set(true);
    this.loaderMessage.set('Processing checkout...');

    const orderPayload = {
      items: this.cart().map((item) => ({
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
        this.cart.set([]);
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
