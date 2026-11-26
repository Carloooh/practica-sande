import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { switchMap, of } from 'rxjs';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto p-6 mt-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <a routerLink="/" class="text-blue-600 hover:underline text-sm mb-4 inline-block">← Volver al catálogo</a>

      @if (isLoading) {
        <p class="text-slate-400">Cargando producto {{ productId }}...</p>
      } @else if (errorMessage) {
        <div class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <p class="font-semibold">No se pudo cargar el producto</p>
          <p class="text-sm mt-1">{{ errorMessage }}</p>
        </div>
      } @else if (product) {
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
        <p class="text-slate-400">Producto no encontrado</p>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  productId = '';
  product: Product | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.isLoading = true;
          this.errorMessage = null;
          this.product = null;
          this.productId = params.get('id') ?? '';

          if (!this.productId) {
            this.isLoading = false;
            this.errorMessage = 'No se especificó un ID de producto en la URL.';
            return of(null);
          }

          return this.http.get<Product>(`http://localhost:5000/api/products/${this.productId}`);
        })
      )
      .subscribe({
        next: (data) => {
          this.product = data;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.product = null;
          console.error('Error al cargar detalle:', err);

          if (err.status === 404) {
            this.errorMessage = `No existe un producto con el ID "${this.productId}".`;
          } else if (err.status === 0) {
            this.errorMessage = 'No hay conexión con el servidor (revisa si la API está encendida o si hay bloqueo CORS).';
          } else {
            this.errorMessage = `Error del servidor (${err.status}): ${err.message}`;
          }
        }
      });
  }
}