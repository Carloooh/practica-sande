import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion.service';
import { Cotizacion } from '../../models/cotizacion.model';

@Component({
  selector: 'app-cotizacion-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">📋 Listado de Cotizaciones</h2>
          <p class="text-sm text-slate-500">Historial de cotizaciones generadas</p>
        </div>
        <span class="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          Total: {{ cotizaciones.length }}
        </span>
      </div>

      <!-- Estado de Carga -->
      @if (isLoading) {
        <div class="text-center py-16 text-slate-400">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-3"></div>
          <p>Cargando cotizaciones...</p>
        </div>
      }

      <!-- Estado de Error -->
      @else if (errorMessage) {
        <div class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm text-center">
          <p class="font-semibold">{{ errorMessage }}</p>
          <button (click)="loadCotizaciones()" class="mt-2 text-xs underline font-bold">Reintentar</button>
        </div>
      }

      <!-- Tabla de Cotizaciones -->
      @else {
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th class="py-3 px-4"># ID</th>
                <th class="py-3 px-4">Cotizante</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Productos</th>
                <th class="py-3 px-4">Total</th>
                <th class="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of cotizaciones; track item.id) {
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-bold text-slate-900">#{{ item.id }}</td>
                  <td class="py-3 px-4 font-medium text-slate-800">{{ item.personaCotizante }}</td>
                  <td class="py-3 px-4 text-slate-500">{{ item.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="py-3 px-4">
                    <span class="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                      {{ item.items?.length || 0 }} items
                    </span>
                  </td>
                  <td class="py-3 px-4 font-bold text-slate-900">\${{ item.total | number }}</td>
                  <td class="py-3 px-4 text-center">
                    <a [routerLink]="['/cotizaciones', item.id]" 
                       class="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition">
                      Ver Detalle →
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400">
                    No hay cotizaciones registradas aún.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class CotizacionListComponent implements OnInit {
  private cotizacionService = inject(CotizacionService);
  private cdr = inject(ChangeDetectorRef);

  cotizaciones: Cotizacion[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.loadCotizaciones();
  }

  loadCotizaciones() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.cotizacionService.getAll().subscribe({
      next: (data) => {
        this.cotizaciones = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar cotizaciones:', err);
        this.errorMessage = 'No se pudo conectar con la API de cotizaciones.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
