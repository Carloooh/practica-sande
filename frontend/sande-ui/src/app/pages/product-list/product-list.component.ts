import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../components/product/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef); // <-- Notifica a Angular para redibujar la lista

  products: Product[] = [];
  isLoading = true;
  errorMessage = '';
  lastSelectedName = '';

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
        this.cdr.markForCheck(); // <-- Fuerza a Angular a mostrar las tarjetas
      },
      error: (err) => {
        console.error('Error al conectar con la API:', err);
        this.errorMessage = 'No se pudo obtener el listado de productos.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onProductSelected(product: Product) {
    this.lastSelectedName = product.name;
    this.cdr.markForCheck();
  }
}
