import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CotizacionService } from '../../services/cotizacion.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto py-8 px-4">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">🛒 Carrito de Cotización</h2>
          <p class="text-sm text-slate-500">Revisa los productos seleccionados y genera la cotización</p>
        </div>
        @if (cartService.count() > 0) {
          <button 
            (click)="cartService.clearCart()" 
            class="text-xs text-rose-600 hover:underline font-semibold">
            Vaciar Carrito
          </button>
        }
      </div>

      <!-- Carrito Vacío -->
      @if (cartService.items().length === 0) {
        <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <span class="text-5xl block mb-3">🛒</span>
          <h3 class="text-lg font-bold text-slate-800">Tu carrito está vacío</h3>
          <p class="text-sm text-slate-500 mt-1 mb-6">Agrega productos desde el catálogo para cotizar.</p>
          <a routerLink="/" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition">
            Ver Productos
          </a>
        </div>
      } 
      
      <!-- Carrito con Productos -->
      @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Tabla de Productos (2 Columnas) -->
          <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-fit">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Producto</th>
                  <th class="py-3 px-4">Precio</th>
                  <th class="py-3 px-4 text-center">Cantidad</th>
                  <th class="py-3 px-4 text-right">Subtotal</th>
                  <th class="py-3 px-4 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of cartService.items(); track item.product.id) {
                  <tr>
                    <td class="py-3 px-4 font-semibold text-slate-800">{{ item.product.name }}</td>
                    <td class="py-3 px-4">\${{ item.product.price | number }}</td>
                    <td class="py-3 px-4 text-center">
                      <div class="inline-flex items-center border border-slate-200 rounded-lg">
                        <button (click)="cartService.updateQuantity(item.product.id, -1)" class="px-2.5 py-1 hover:bg-slate-100 text-slate-600 font-bold">-</button>
                        <span class="px-3 font-semibold text-slate-800">{{ item.quantity }}</span>
                        <button (click)="cartService.updateQuantity(item.product.id, 1)" class="px-2.5 py-1 hover:bg-slate-100 text-slate-600 font-bold">+</button>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-slate-900">\${{ (item.quantity * item.product.price) | number }}</td>
                    <td class="py-3 px-4 text-center">
                      <button (click)="cartService.removeFromCart(item.product.id)" class="text-rose-500 hover:text-rose-700 text-xs font-bold">✕</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Formulario de Emisión (1 Columna) -->
          <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between h-fit">
            <div>
              <h3 class="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Finalizar Cotización</h3>

              <!-- Campo Nombre del Cliente -->
              <div class="mb-4">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre del Cliente / Empresa *</label>
                <input 
                  [(ngModel)]="personaCotizante" 
                  placeholder="Ej: Francisco Sande" 
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-blue-500" 
                />
              </div>

              <!-- Resumen de Costos -->
              <div class="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <div class="flex justify-between">
                  <span>Total de unidades:</span>
                  <span class="font-bold text-slate-800">{{ cartService.count() }} u.</span>
                </div>
                <div class="flex justify-between text-base border-t border-slate-100 pt-2 font-black text-slate-900">
                  <span>Total a Pagar:</span>
                  <span>\${{ cartService.total() | number }}</span>
                </div>
              </div>

              @if (errorMensaje) {
                <p class="text-rose-600 text-xs mt-3 bg-rose-50 p-2 rounded">{{ errorMensaje }}</p>
              }
            </div>

            <!-- Botón Generar Cotización -->
            <button 
              (click)="generarCotizacion()" 
              [disabled]="isSubmitting"
              class="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm">
              {{ isSubmitting ? 'Guardando en Base de Datos...' : '🚀 Generar Cotización' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  cartService = inject(CartService);
  private cotizacionService = inject(CotizacionService);
  private router = inject(Router);

  personaCotizante = '';
  isSubmitting = false;
  errorMensaje = '';

  generarCotizacion() {
    if (!this.personaCotizante.trim()) {
      this.errorMensaje = 'Por favor ingresa el nombre de la persona o empresa.';
      return;
    }

    this.isSubmitting = true;
    this.errorMensaje = '';

    const payload = {
      personaCotizante: this.personaCotizante.trim(),
      items: this.cartService.items().map(item => ({
        idProducto: item.product.id,
        cantidad: item.quantity,
        precio: item.product.price
      }))
    };

    this.cotizacionService.create(payload).subscribe({
      next: (cotizacionCreada) => {
        this.cartService.clearCart();
        this.isSubmitting = false;
        
        // Redirige al detalle de la cotización creada o a la lista
        const id = cotizacionCreada?.id;
        if (id) {
          this.router.navigate(['/cotizaciones', id]);
        } else {
          this.router.navigate(['/cotizaciones']);
        }
      },
      error: (err) => {
        console.error('Error al generar cotización:', err);
        this.errorMensaje = 'Ocurrió un error al guardar en la base de datos.';
        this.isSubmitting = false;
      }
    });
  }
}
