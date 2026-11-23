# Guía Frontend Angular para Desarrolladores Next.js / React

Guía completa de arquitectura, sintaxis y patrones para resolver el componente de **Angular conectado a la API C#** en la prueba técnica presencial de **SANDE S.A.**

---

## 1. Tabla de Equivalencias: De Next.js a Angular Moderno

Si vienes de React y Next.js, aquí tienes el "traductor mental" directo:

| En Next.js (App Router / React) | En Angular Moderno (v17/18/19 Standalone) |
| :--- | :--- |
| `app/layout.tsx` (`{children}`) | `app.html` (`<router-outlet />`) |
| `app/producto/[id]/page.tsx` | `app.routes.ts`: `{ path: 'producto/:id', component: ... }` |
| `<Link href="/producto/5">` | `<a [routerLink]="['/producto', 5]">` |
| `props` (Padre ➔ Hijo) | `@Input({ required: true }) product!: Product;` |
| Callback `onSelect(data)` (Hijo ➔ Padre) | `@Output() select = new EventEmitter<Product>();` |
| `{items.map(item => <Card key={item.id} />)}` | `@for (item of items; track item.id) { <app-card /> }` |
| `{isLoading ? <Spinner /> : <List />}` | `@if (isLoading) { <Spinner /> } @else { <List /> }` |
| `useState(0)` | Variable directa en la clase (`count = 0;`) o Signal (`count = signal(0);`) |
| `useEffect(() => { ... }, [])` | Ciclo de vida: `ngOnInit() { ... }` |
| `params.id` | `inject(ActivatedRoute).snapshot.paramMap.get('id')` |
| `fetch('http://localhost:5000/api/...')` | `inject(HttpClient).get<T>('http://localhost:5000/api/...')` |
| Componentes con CSS en el mismo archivo | `template: \`...\`` y `styles: \`...\`` en `@Component` (SFC) |

---

## 2. Configuración Esencial: `src/app/app.config.ts`

> ⚠️ **Punto Crítico de Examen:** Si no configuras `provideHttpClient()`, la app fallará al hacer llamadas a la API.

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()) // Habilita cliente HTTP compatible con SSR y cliente
  ]
};
```

---

## 3. Modelo de Datos: `src/app/models/product.model.ts`

```typescript
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}
```

---

## 4. Servicio HTTP: `src/app/services/product.service.ts`

Encapsula todas las llamadas a la API C#:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/products'; // Ajustar puerto según launchSettings.json

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  // Ejemplo con Token JWT en cabecera
  getAllWithToken(token: string): Observable<Product[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Product[]>(this.apiUrl, { headers });
  }
}
```

---

## 5. Componentes Paso a Paso

### A. Navbar: `src/app/components/navbar/navbar.component.ts`
Componente en un solo archivo con Tailwind:

```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div class="flex items-center gap-3">
        <span class="text-2xl">📦</span>
        <h1 class="text-xl font-bold tracking-wide">SANDE S.A.</h1>
      </div>
      <div class="flex gap-6 text-sm font-medium">
        <a routerLink="/" routerLinkActive="text-blue-400 font-bold" [routerLinkActiveOptions]="{exact: true}" class="hover:text-blue-300 transition">
          Productos
        </a>
      </div>
    </nav>
  `
})
export class NavbarComponent {}
```

---

### B. Componente Hijo (Tarjeta): `src/app/components/product-card/product-card.component.ts`
Demuestra **comunicación Padre ➔ Hijo (`@Input`)** e **Hijo ➔ Padre (`@Output`)**:

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start gap-2">
          <h3 class="text-lg font-bold text-slate-800">{{ product.name }}</h3>
          <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                [class]="product.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
            {{ product.stock > 0 ? product.stock + ' en stock' : 'Agotado' }}
          </span>
        </div>
        <p class="text-slate-500 text-sm mt-2 line-clamp-2">
          {{ product.description || 'Sin descripción disponible' }}
        </p>
      </div>

      <div class="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span class="text-2xl font-black text-slate-900">\${{ product.price }}</span>

        <div class="flex gap-2">
          <!-- Disparo de evento al Padre -->
          <button 
            type="button"
            (click)="notifyParent()" 
            class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
            Seleccionar
          </button>

          <!-- Navegación dinámica /producto/[id] -->
          <a 
            [routerLink]="['/producto', product.id]" 
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
            Detalles →
          </a>
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  // Entrada desde el padre (Props)
  @Input({ required: true }) product!: Product;

  // Salida hacia el padre (Custom Event)
  @Output() productSelected = new EventEmitter<Product>();

  notifyParent() {
    this.productSelected.emit(this.product);
  }
}
```

---

### C. Componente Padre (Lista): `src/app/pages/product-list/product-list.component.ts`
El componente que consume el servicio, lista los datos y escucha los eventos del hijo:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      
      <!-- Banner de bienvenida / feedback de selección -->
      @if (selectedProduct) {
        <div class="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 flex justify-between items-center">
          <div>
            <span class="font-bold">Producto Seleccionado (Hijo ➔ Padre):</span> 
            {{ selectedProduct.name }} (Precio: \${{ selectedProduct.price }})
          </div>
          <button (click)="selectedProduct = null" class="text-xs text-blue-600 hover:underline">Cerrar</button>
        </div>
      }

      <!-- Formulario Rápido para Crear Producto (Demuestra POST) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 class="text-md font-bold text-slate-800 mb-3">➕ Agregar Nuevo Producto</h3>
        <form (ngSubmit)="saveProduct()" class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input [(ngModel)]="newProduct.name" name="name" placeholder="Nombre" required
                 class="border border-slate-300 rounded-lg p-2 text-sm focus:outline-blue-500" />
          <input [(ngModel)]="newProduct.price" name="price" type="number" placeholder="Precio" required
                 class="border border-slate-300 rounded-lg p-2 text-sm focus:outline-blue-500" />
          <input [(ngModel)]="newProduct.stock" name="stock" type="number" placeholder="Stock" required
                 class="border border-slate-300 rounded-lg p-2 text-sm focus:outline-blue-500" />
          <button type="submit" 
                  class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition">
            Guardar Producto
          </button>
        </form>
      </div>

      <!-- Barra de Filtro / Búsqueda en Vivo -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-black text-slate-800">Catálogo de Productos</h2>
        <input 
          [(ngModel)]="searchFilter" 
          placeholder="Buscar producto..." 
          class="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-blue-500" />
      </div>

      <!-- Grid de Tarjetas (Renderizado del Componente Hijo) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (item of filteredProducts; track item.id) {
          <app-product-card 
            [product]="item" 
            (productSelected)="onProductSelected($event)" 
          />
        } @empty {
          <div class="col-span-3 text-center py-12 text-slate-400">
            No se encontraron productos registrados.
          </div>
        }
      </div>

    </div>
  `
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  selectedProduct: Product | null = null;
  searchFilter = '';

  newProduct: Partial<Product> = {
    name: '',
    description: 'Registrado desde la aplicación web',
    price: 0,
    stock: 0
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.productService.getAll().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error al consultar API:', err)
    });
  }

  saveProduct() {
    if (!this.newProduct.name || !this.newProduct.price) return;

    this.productService.create(this.newProduct).subscribe({
      next: () => {
        this.loadData();
        this.newProduct = { name: '', description: 'Registrado desde la web', price: 0, stock: 0 };
      },
      error: (err) => console.error('Error al guardar:', err)
    });
  }

  onProductSelected(product: Product) {
    this.selectedProduct = product;
  }

  get filteredProducts(): Product[] {
    if (!this.searchFilter) return this.products;
    return this.products.filter(p => 
      p.name.toLowerCase().includes(this.searchFilter.toLowerCase())
    );
  }
}
```

---

### D. Componente Detalle (`producto/:id`): `src/app/pages/product-detail/product-detail.component.ts`
Equivalente a `app/producto/[id]/page.tsx` en Next.js:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto p-6 mt-10">
      <a routerLink="/" class="text-blue-600 hover:underline text-sm font-semibold mb-4 inline-block">
        ← Volver al catálogo
      </a>

      @if (product) {
        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">Detalle del Producto #{{ product.id }}</span>
          <h2 class="text-3xl font-black text-slate-900 mt-2">{{ product.name }}</h2>
          <p class="text-slate-600 mt-4 leading-relaxed">{{ product.description || 'Sin descripción detallada.' }}</p>

          <div class="grid grid-cols-2 gap-4 mt-8 p-4 bg-slate-50 rounded-xl">
            <div>
              <span class="text-xs text-slate-400 font-bold uppercase">Precio Unitario</span>
              <p class="text-3xl font-extrabold text-slate-900 mt-1">\${{ product.price }}</p>
            </div>
            <div>
              <span class="text-xs text-slate-400 font-bold uppercase">Inventario Disponible</span>
              <p class="text-3xl font-extrabold text-slate-900 mt-1">{{ product.stock }} u.</p>
            </div>
          </div>
        </div>
      } @else {
        <div class="text-center py-12 text-slate-400">
          Cargando información del producto...
        </div>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  product: Product | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getById(id).subscribe({
        next: (data) => this.product = data,
        error: (err) => console.error('Error al cargar detalle:', err)
      });
    }
  }
}
```

---

## 6. Enrutamiento Principal: `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'producto/:id', component: ProductDetailComponent },
  { path: '**', redirectTo: '' }
];
```

---

## 7. Layout Base: `src/app/app.html` y `src/app/app.ts`

### `src/app/app.html`
```html
<app-navbar />
<main class="min-h-screen bg-slate-50">
  <router-outlet />
</main>
```

### `src/app/app.ts`
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
```
