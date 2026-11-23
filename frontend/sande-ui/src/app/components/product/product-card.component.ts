import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start">
          <h3 class="text-lg font-semibold text-slate-800">{{ product.name }}</h3>
          <span class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Stock: {{ product.stock }}
          </span>
        </div>
        <p class="text-slate-500 text-sm mt-2">{{ product.description || 'Sin descripción' }}</p>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
        <span class="text-xl font-bold text-slate-900">\${{ product.price }}</span>
        
        <div class="flex gap-2">
          <!-- Comunicación Hijo ➔ Padre via Evento -->
          <button 
            (click)="onSelectProduct()" 
            class="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-sm transition">
            Notificar Padre
          </button>

          <!-- Navegación a la página de detalle tipo Next.js -->
          <a 
            [routerLink]="['/producto', product.id]" 
            class="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-medium transition">
            Ver Detalle
          </a>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  // 1. Recibir datos del Padre (Props)
  @Input({ required: true }) product!: Product;

  // 2. Enviar evento al Padre (Callbacks)
  @Output() select = new EventEmitter<Product>();

  onSelectProduct() {
    this.select.emit(this.product);
  }
}