import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Catálogo de Productos</h2>
        <span class="text-sm text-slate-500">Total: {{ products.length }}</span>
      </div>

      <!-- Notificación de evento emitido por el hijo -->
      @if (lastSelectedName) {
        <div class="bg-blue-50 border-l-4 border-blue-500 p-3 mb-6 text-blue-700 text-sm">
          Padre notificado: Seleccionaste <strong>{{ lastSelectedName }}</strong>
        </div>
      }

      <!-- Grid de productos -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (item of products; track item.id) {
          <!-- Componente Hijo con @Input [product] y @Output (select) -->
          <app-product-card 
            [product]="item" 
            (select)="onProductSelected($event)" 
          />
        } @empty {
          <p class="text-slate-500 col-span-3 text-center py-10">Cargando productos o sin registros...</p>
        }
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  private http = inject(HttpClient);
  products: Product[] = [];
  lastSelectedName = '';

  ngOnInit() {
    // Llamada directa a tu API de C#
    this.http.get<Product[]>('http://localhost:5000/api/products')
      .subscribe({
        next: (data) => this.products = data,
        error: (err) => console.error('Error cargando API:', err)
      });
  }

  // Método ejecutado cuando el hijo emite el evento
  onProductSelected(product: Product) {
    this.lastSelectedName = product.name;
  }
}