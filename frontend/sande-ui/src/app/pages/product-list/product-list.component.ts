import { Component, inject, OnInit } from '@angular/core';
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

  // Estados del componente
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';
  lastSelectedName = '';

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(){
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al conectar con la API:', err);
        this.errorMessage = 'No se pudo obtener el listado de producto';
        this.isLoading = false;
      }
    });
  }

  onProductSelected(product: Product) {
    this.lastSelectedName = product.name;
  }
}