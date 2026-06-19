import { Injectable, signal, computed } from '@angular/core';
import { Product } from '@frontend/shared';

export interface CartItem {
  product: Product;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cart = signal<CartItem[]>([]);

  cartSubtotal = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.price * item.quantity, 0);
  });

  cartCount = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.quantity, 0);
  });

  addToCart(product: Product, variantId: string, variantName: string, price: number): void {
    const currentCart = [...this.cart()];
    const existingIdx = currentCart.findIndex((i) => i.variantId === variantId);

    if (existingIdx > -1) {
      currentCart[existingIdx].quantity += 1;
    } else {
      currentCart.push({
        product,
        variantId,
        variantName,
        price,
        quantity: 1
      });
    }
    this.cart.set(currentCart);
  }

  clearCart(): void {
    this.cart.set([]);
  }
}
