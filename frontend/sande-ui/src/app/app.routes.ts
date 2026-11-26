import { Routes } from '@angular/router';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CotizacionListComponent } from './pages/cotizacion-list/cotizacion-list.component';
import { CotizacionDetailComponent } from './pages/cotizacion-detail/cotizacion-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { DevolucionesComponent } from './pages/devoluciones/devoluciones.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'producto/:id', component: ProductDetailComponent },
  { path: 'cotizaciones', component: CotizacionListComponent },
  { path: 'cotizaciones/:id', component: CotizacionDetailComponent },
  { path: 'carrito', component: CartComponent },
  { path: 'devoluciones', component: DevolucionesComponent },
  { path: '**', redirectTo: '' }
];
