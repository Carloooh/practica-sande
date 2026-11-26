import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto p-6 mt-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <a routerLink="/" class="text-blue-600 hover:underline text-sm mb-4 inline-block">← Volver al catálogo</a>
      
      <!-- 1. Estado de Carga -->
      @if (isLoading) {
        <div class="py-12 text-center text-slate-400">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-3"></div>
          <p>Cargando información del producto {{ productId }}...</p>
        </div>
      }
      
      <!-- 2. Estado de Error -->
      @else if (errorMessage) {
        <div class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm text-center">
          <p class="font-semibold">{{ errorMessage }}</p>
          <a routerLink="/" class="text-rose-600 underline text-xs mt-2 inline-block">Volver al catálogo</a>
        </div>
      }

      <!-- 3. Estado con Datos -->
      @else if (product) {
        <h2 class="text-3xl font-bold text-slate-800">{{ product.name }}</h2>
        <p class="text-slate-600 mt-3 text-base leading-relaxed">{{ product.description }}</p>
        
        <div class="mt-6 flex justify-between items-center bg-slate-50 p-4 rounded-lg">
          <div>
            <span class="text-xs text-slate-400 block uppercase">Precio</span>
            <span class="text-2xl font-bold text-slate-900">\${{ product.price }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block uppercase">Stock</span>
            <span class="text-lg font-semibold text-slate-700">{{ product.stock }} unidades</span>
          </div>
        </div>
      } 
      
      <!-- 4. No encontrado -->
      @else {
        <p class="text-slate-400 py-6 text-center">Producto no encontrado.</p>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef); // <-- Notifica a Angular para redibujar la pantalla

  productId = '';
  product: Product | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.productId = params.get('id') ?? '';
      if (this.productId) {
        this.loadProduct(this.productId);
      } else {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadProduct(id: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.productService.getById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.isLoading = false;
        this.cdr.markForCheck(); // <-- Fuerza a Angular a salir del estado "cargando"
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.errorMessage = 'No se pudo conectar con la API o el producto no existe.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
