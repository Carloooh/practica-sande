import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 class="text-xl font-bold tracking-wider">🏪 SANDE Inventory</h1>
      <div class="flex gap-4">
        <a routerLink="/" class="hover:text-blue-400 transition">Productos</a>
        <a routerLink="/nuevo" class="hover:text-blue-400 transition">Nuevo Producto</a>
      </div>
    </nav>
  `
})
export class NavbarComponent {}