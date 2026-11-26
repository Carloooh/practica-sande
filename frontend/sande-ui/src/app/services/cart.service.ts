import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Estado global reactivo con Signals
  items = signal<CartItem[]>([]);

  // Contador total de unidades en el carrito
  count = computed(() => 
    this.items().reduce((acc, item) => acc + item.quantity, 0)
  );

  // Monto total acumulado
  total = computed(() => 
    this.items().reduce((acc, item) => acc + (item.quantity * item.product.price), 0)
  );

  // Agregar producto al carrito
  addToCart(product: Product) {
    this.items.update(currentItems => {
      const existing = currentItems.find(i => i.product.id === product.id);
      if (existing) {
        return currentItems.map(i => 
          i.product.id === product.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        return [...currentItems, { product, quantity: 1 }];
      }
    });
  }

  // Quitar producto del carrito
  removeFromCart(productId: number) {
    this.items.update(currentItems => 
      currentItems.filter(i => i.product.id !== productId)
    );
  }

  // Modificar cantidad (+1 o -1)
  updateQuantity(productId: number, delta: number) {
    this.items.update(currentItems => {
      return currentItems
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  }

  // Vaciar carrito
  clearCart() {
    this.items.set([]);
  }
}
