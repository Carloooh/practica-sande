import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto p-6 mt-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <a routerLink="/" class="text-blue-600 hover:underline text-sm mb-4 inline-block">← Volver al catálogo</a>
      
      @if (product) {
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
      } @else {
        <p class="text-slate-400">Cargando producto ID {{ productId }}...</p>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  productId = '';
  product: Product | null = null;

  ngOnInit() {
    // Similar a params.id de Next.js:
    this.productId = this.route.snapshot.paramMap.get('id') ?? '';
    
    if (this.productId) {
      this.http.get<Product>(`http://localhost:5000/api/products/${this.productId}`)
        .subscribe({
          next: (data) => this.product = data,
          error: (err) => console.error('Error al cargar detalle:', err)
        });
    }
  }
}